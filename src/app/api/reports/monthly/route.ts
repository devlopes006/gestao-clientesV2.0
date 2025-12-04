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

    const report = await ReportingService.getMonthlyReport(
      profile.orgId!,
      year,
      month
    )
    return NextResponse.json(report)
  } catch (error) {
    console.error('Error getting monthly report:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar relatório mensal',
      },
      { status: 500 }
    )
  }
}
