import {
  clientListQuerySchema,
  createClientSchema,
} from '@/domain/clients/validators'
import { prisma } from '@/lib/prisma'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { ClientBillingService } from '@/services/billing/ClientBillingService'
import { createClient } from '@/services/repositories/clients'
import { ClientStatus } from '@/types/enums'
import type { ClientPlan, SocialChannel } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting para criação de clientes
    const id = getIdentifier(req as unknown as Request)
    const rl = await checkRateLimit(id, apiRatelimit)
    if (!rl.success) {
      const res429 = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
      return applySecurityHeaders(req, res429)
    }
    const guard = guardAccess(req)
    if (guard) return guard
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Only OWNER can create clients
    if (role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Sem permissão para criar clientes' },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Validate request body with Zod
    const validated = createClientSchema.parse(body)

    const client = await createClient({
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      status: validated.status as ClientStatus,
      plan: validated.plan ? (validated.plan as ClientPlan) : undefined,
      mainChannel: validated.mainChannel
        ? (validated.mainChannel as SocialChannel)
        : undefined,
      orgId,
      contractStart: validated.contractStart
        ? new Date(validated.contractStart)
        : undefined,
      contractEnd: validated.contractEnd
        ? new Date(validated.contractEnd)
        : undefined,
      paymentDay: validated.paymentDay,
      contractValue: validated.contractValue,
      isInstallment: validated.isInstallment,
      installmentCount: validated.installmentCount,
      installmentValue: validated.installmentValue,
      installmentPaymentDays: validated.installmentPaymentDays,
    })

    // Geração de parcelas delegada à camada de serviço
    await ClientBillingService.generateInstallments({
      clientId: client.id,
      isInstallment: validated.isInstallment,
      installmentCount: validated.installmentCount ?? undefined,
      contractValue: validated.contractValue ?? undefined,
      contractStart: validated.contractStart
        ? new Date(validated.contractStart)
        : undefined,
      paymentDay: validated.paymentDay ?? null,
      installmentValue: validated.installmentValue ?? null,
      installmentPaymentDays: validated.installmentPaymentDays ?? null,
    })

    const res = NextResponse.json(client, { status: 201 })
    return applySecurityHeaders(req, res)
  } catch (error) {
    if (error instanceof ZodError) {
      const res = NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
      return applySecurityHeaders(req, res)
    }
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'clients:create',
      level: 'error',
    })
    Sentry.captureException(error)
    console.error('Erro ao criar cliente:', error)
    const res = NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
    return applySecurityHeaders(req, res)
  }
}

export async function GET(req: NextRequest) {
  try {
    // Rate limiting para listagem de clientes
    const id = getIdentifier(req as unknown as Request)
    const rl = await checkRateLimit(id, apiRatelimit)
    if (!rl.success) {
      const res429 = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
      return applySecurityHeaders(req, res429)
    }
    const guard = guardAccess(req)
    if (guard) return guard
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // CLIENT só vê seu próprio registro (derivado de clientUserId)
    if (role === 'CLIENT') {
      // Busca o Client vinculado
      const client = await prisma.client.findFirst({
        where: { orgId, clientUserId: user.id },
      })
      if (!client) {
        const resEmpty = NextResponse.json({ data: [] })
        return applySecurityHeaders(req, resEmpty)
      }
      const resClient = NextResponse.json({
        data: [
          {
            id: client.id,
            name: client.name,
            email: client.email,
          },
        ],
      })
      return applySecurityHeaders(req, resClient)
    }

    const query = clientListQuerySchema.safeParse({
      lite: req.nextUrl.searchParams.get('lite') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
      cursor: req.nextUrl.searchParams.get('cursor') ?? undefined,
    })

    if (!query.success) {
      const resBadRequest = NextResponse.json(
        { error: 'Parâmetros inválidos', details: query.error.format() },
        { status: 400 }
      )
      return applySecurityHeaders(req, resBadRequest)
    }

    const { lite, limit, cursor } = query.data
    const take = Math.min(limit ?? 50, 200)

    // OWNER / STAFF: retorno otimizado com select
    const liteMode = lite === '1'

    if (liteMode) {
      const clients = await prisma.client.findMany({
        where: { orgId },
        select: {
          id: true,
          name: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
      })
      const resLite = NextResponse.json({
        data: clients,
        meta: { limit: take },
      })
      return applySecurityHeaders(req, resLite)
    }

    // Select apenas campos necessários para listagem completa
    const clients = await prisma.client.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        plan: true,
        mainChannel: true,
        paymentStatus: true,
        contractStart: true,
        contractEnd: true,
        contractValue: true,
        paymentDay: true,
        isInstallment: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    })
    const hasNextPage = clients.length > take
    const data = clients.slice(0, take)
    const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null

    const resAll = NextResponse.json({
      data,
      meta: {
        limit: take,
        nextCursor,
        hasNextPage,
      },
    })
    return applySecurityHeaders(req, resAll)
  } catch (e) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'clients:list',
      level: 'error',
    })
    Sentry.captureException(e)
    console.error('Erro ao listar clientes', e)
    const resErr = NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    return applySecurityHeaders(req, resErr)
  }
}
