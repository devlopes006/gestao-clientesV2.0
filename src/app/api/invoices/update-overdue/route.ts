import { getSessionProfile } from '@/services/auth/session'
import { FinancialAutomationService } from '@/services/financial/FinancialAutomationService'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const count = await FinancialAutomationService.updateOverdueInvoices(
      profile.orgId!
    )

    return NextResponse.json({
      success: true,
      updated: count,
      message: `${count} fatura(s) marcada(s) como vencida(s)`,
    })
  } catch (error) {
    console.error('Error updating overdue invoices:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar faturas vencidas',
      },
      { status: 500 }
    )
  }
}
