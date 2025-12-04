import { getSessionProfile } from '@/services/auth/session'
import { FinancialAutomationService } from '@/services/financial/FinancialAutomationService'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const results =
      await FinancialAutomationService.generateSmartMonthlyInvoices(
        profile.orgId!,
        profile.user!.id
      )

    return NextResponse.json({
      successCount: results.success.length,
      blockedCount: results.blocked.length,
      errorCount: results.errors.length,
      summary: results.summary,
      success: results.success.map((inv) => ({
        id: inv.id,
        number: inv.number,
        clientName: inv.client?.name,
        total: inv.total,
        dueDate: inv.dueDate,
        installmentInfo: inv.installmentInfo,
      })),
      blocked: results.blocked,
      errors: results.errors,
    })
  } catch (error) {
    console.error('Error generating monthly invoices:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao gerar faturas mensais',
      },
      { status: 500 }
    )
  }
}
