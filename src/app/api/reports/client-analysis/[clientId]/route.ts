import { getSessionProfile } from '@/services/auth/session'
import { ReportingService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(
      searchParams.get('year') || new Date().getFullYear().toString()
    )

    const dateFrom = new Date(year, 0, 1)
    const dateTo = new Date(year, 11, 31, 23, 59, 59, 999)

    const analysis = await ReportingService.getClientAnalysis(
      clientId,
      profile.orgId!,
      dateFrom,
      dateTo
    )

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error getting client analysis:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar análise do cliente',
      },
      { status: 500 }
    )
  }
}
