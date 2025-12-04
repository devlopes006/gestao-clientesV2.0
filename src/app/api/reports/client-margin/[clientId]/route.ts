import { getSessionProfile } from '@/services/auth/session'
import { CostTrackingService } from '@/services/financial'
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
    const month = parseInt(
      searchParams.get('month') || (new Date().getMonth() + 1).toString()
    )

    const dateFrom = new Date(year, month - 1, 1)
    const dateTo = new Date(year, month, 0, 23, 59, 59, 999)

    const margin = await CostTrackingService.calculateClientMargin(
      clientId,
      profile.orgId!,
      dateFrom,
      dateTo
    )

    return NextResponse.json(margin)
  } catch (error) {
    console.error('Error calculating client margin:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao calcular margem do cliente',
      },
      { status: 500 }
    )
  }
}
