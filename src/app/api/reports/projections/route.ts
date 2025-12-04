import { getSessionProfile } from '@/services/auth/session'
import { FinancialAutomationService } from '@/services/financial/FinancialAutomationService'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '3')

    const projections = await FinancialAutomationService.calculateProjection(
      profile.orgId,
      Math.min(months, 12) // Máximo 12 meses
    )

    return NextResponse.json(projections)
  } catch (error) {
    console.error('Error calculating projections:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao calcular projeções',
      },
      { status: 500 }
    )
  }
}
