import { cacheManager } from '@/lib/cache'
import { getSessionProfile } from '@/services/auth/session'
import { ReportingService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(
      searchParams.get('year') || new Date().getFullYear().toString()
    )
    const month = parseInt(
      searchParams.get('month') || (new Date().getMonth() + 1).toString()
    )

    // Normalize to full month range (inclusive end-of-day)
    const dateFrom = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const lastDay = new Date(year, month, 0)
    const dateTo = new Date(
      lastDay.getFullYear(),
      lastDay.getMonth(),
      lastDay.getDate(),
      23,
      59,
      59,
      999
    )

    // Try cache first (5 min TTL for dashboard)
    const cacheKey = `dashboard:${profile.orgId}:${year}-${month}`
    const cached = cacheManager.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const dashboard = await ReportingService.getDashboard(
      profile.orgId,
      dateFrom,
      dateTo
    )

    // Cache for 5 minutes
    cacheManager.set(cacheKey, dashboard, 300)

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error getting dashboard:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao buscar dashboard',
      },
      { status: 500 }
    )
  }
}
