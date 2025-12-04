import { getSessionProfile } from '@/services/auth/session'
import { TransactionService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined

    const summary = await TransactionService.getSummary(
      profile.orgId,
      dateFrom,
      dateTo
    )
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
