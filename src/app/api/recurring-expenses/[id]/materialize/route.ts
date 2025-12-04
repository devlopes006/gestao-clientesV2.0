import { getSessionProfile } from '@/services/auth/session'
import { RecurringExpenseService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await getSessionProfile()
    if (
      !profile ||
      profile.role !== 'OWNER' ||
      !profile.orgId ||
      !profile.user?.id
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const result = await RecurringExpenseService.materializeSingle(
      profile.orgId,
      id,
      profile.user.id
    )

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error materializing single recurring expense:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao materializar despesa',
      },
      { status: 400 }
    )
  }
}
