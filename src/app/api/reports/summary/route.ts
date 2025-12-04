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
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam) : undefined

    const summary = await ReportingService.getGlobalSummary(profile.orgId, year)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error getting global summary:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resumo geral' },
      { status: 500 }
    )
  }
}
