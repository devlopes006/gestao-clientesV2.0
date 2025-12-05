import {
  TransactionService,
  transactionSummaryInput,
} from '@/domain/transactions/TransactionService'
import { TransactionPrismaRepository } from '@/infrastructure/prisma/TransactionPrismaRepository'
import { cacheManager } from '@/lib/cache'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { getSessionProfile } from '@/services/auth/session'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    // Rate limit para resumo
    const id = getIdentifier(request)
    const rl = await checkRateLimit(id, apiRatelimit)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
    }
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = transactionSummaryInput
      .extend({ orgId: z.string().min(1).default(profile.orgId!) })
      .safeParse({
        startDate: searchParams.get('dateFrom') ?? undefined,
        endDate: searchParams.get('dateTo') ?? undefined,
      })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Try cache first
    const cacheKey = `transactions:summary:${profile.orgId}:${parsed.data.startDate || 'all'}:${parsed.data.endDate || 'all'}`
    const cached = cacheManager.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const prisma = new PrismaClient()
    const svc = new TransactionService(new TransactionPrismaRepository(prisma))
    const summary = await svc.summary(parsed.data)

    // Cache for 5 minutes
    cacheManager.set(cacheKey, summary, 300)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error getting transaction summary:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao buscar resumo',
      },
      { status: 500 }
    )
  }
}
