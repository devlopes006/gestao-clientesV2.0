import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { getSessionProfile } from '@/services/auth/session'
import { ReportingService } from '@/services/financial'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const idKey = getIdentifier(request)
    const rl = await checkRateLimit(idKey, apiRatelimit)
    if (!rl.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          resetAt: rl.reset.toISOString(),
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : undefined

    const summary = await ReportingService.getGlobalSummary(profile.orgId, year)
    return NextResponse.json(summary)
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'reports:summary',
      level: 'error',
    })
    Sentry.captureException(error)
    console.error('Error getting global summary:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resumo geral' },
      { status: 500 }
    )
  }
}
