import { getSessionProfile } from '@/services/auth/session'
import { CostTrackingService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const profile = await getSessionProfile()
    if (
      !profile ||
      profile.role !== 'OWNER' ||
      !profile.orgId ||
      !profile.user?.id
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const results = await CostTrackingService.materializeMonthly(
      profile.orgId,
      profile.user.id
    )

    return NextResponse.json({
      success: results.success.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
      details: results,
    })
  } catch (error) {
    console.error('Error materializing costs:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao materializar custos',
      },
      { status: 500 }
    )
  }
}
