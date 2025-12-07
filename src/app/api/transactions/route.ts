import {
  TransactionService as DomainTransactionService,
  transactionInput,
} from '@/domain/transactions/TransactionService'
import { TransactionPrismaRepository } from '@/infrastructure/prisma/TransactionPrismaRepository'
import { ApiResponseHandler } from '@/lib/api-response'
import { cacheInvalidation } from '@/lib/cache'
import { prisma } from '@/lib/prisma'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { transactionListQuerySchema } from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { TransactionService as FinancialTransactionService } from '@/services/financial'
import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '@prisma/client'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    // Rate limit listagem de transações
    const id = getIdentifier(request)
    const rl = await checkRateLimit(id, apiRatelimit)
    if (!rl.success) {
      return ApiResponseHandler.rateLimitExceeded(rl.reset.toISOString())
    }
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return ApiResponseHandler.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const parsed = transactionListQuerySchema.safeParse({
      type: searchParams.get('type') ?? undefined,
      subtype: searchParams.get('subtype') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      clientId: searchParams.get('clientId') ?? undefined,
      invoiceId: searchParams.get('invoiceId') ?? undefined,
      costItemId: searchParams.get('costItemId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      includeDeleted: searchParams.get('includeDeleted') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      orderBy: searchParams.get('orderBy') ?? undefined,
      orderDirection: searchParams.get('orderDirection') ?? undefined,
    })
    if (!parsed.success) {
      return ApiResponseHandler.validationError(
        'Parâmetros inválidos',
        parsed.error.format()
      )
    }

    const q = parsed.data
    const filters = {
      orgId: profile.orgId,
      type: q.type as TransactionType | undefined,
      subtype: q.subtype as TransactionSubtype | undefined,
      status: q.status as TransactionStatus | undefined,
      clientId: q.clientId || undefined,
      invoiceId: q.invoiceId || undefined,
      costItemId: q.costItemId || undefined,
      category: q.category || undefined,
      dateFrom: q.dateFrom || undefined,
      dateTo: q.dateTo || undefined,
      includeDeleted: q.includeDeleted === 'true',
    }

    const pagination = {
      page: q.page ?? 1,
      limit: q.limit ?? 50,
      orderBy: (q.orderBy ?? 'date') as 'date' | 'amount' | 'createdAt',
      orderDirection: (q.orderDirection ?? 'desc') as 'asc' | 'desc',
    }

    const result = await FinancialTransactionService.list(filters, pagination)

    // Formatar resposta com clientName diretamente do include
    const transactionsWithClientNames = result.transactions.map(
      (transaction) => ({
        ...transaction,
        clientName: transaction.client?.name || null,
      })
    )

    return ApiResponseHandler.paginatedList(transactionsWithClientNames, {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
    })
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'transactions:list',
      level: 'error',
    })
    Sentry.captureException(error)
    console.error('Error listing transactions:', error)
    return ApiResponseHandler.serverError(
      error instanceof Error ? error.message : 'Erro ao listar transações'
    )
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit criação de transações
    const id = getIdentifier(request)
    const rl = await checkRateLimit(id, apiRatelimit)
    if (!rl.success) {
      return ApiResponseHandler.rateLimitExceeded(rl.reset.toISOString())
    }
    const profile = await getSessionProfile()
    if (
      !profile ||
      profile.role !== 'OWNER' ||
      !profile.orgId ||
      !profile.user?.id
    ) {
      return ApiResponseHandler.unauthorized()
    }

    const body = await request.json().catch(() => ({}))

    const parsed = transactionInput
      .extend({ orgId: z.string().min(1).default(profile.orgId!) })
      .safeParse({ ...body, orgId: profile.orgId })
    if (!parsed.success) {
      return ApiResponseHandler.validationError(
        'Parâmetros inválidos',
        parsed.error.flatten()
      )
    }

    const svc = new DomainTransactionService(
      new TransactionPrismaRepository(prisma as any)
    )
    const created = await svc.create(parsed.data)

    // Invalidate cache after transaction creation
    cacheInvalidation.transactions(profile.orgId)

    return ApiResponseHandler.created(created)
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'transactions:create',
      level: 'error',
    })
    Sentry.captureException(error)
    console.error('Error creating transaction:', error)
    return ApiResponseHandler.error(
      error instanceof Error ? error.message : 'Erro ao criar transação',
      400
    )
  }
}
