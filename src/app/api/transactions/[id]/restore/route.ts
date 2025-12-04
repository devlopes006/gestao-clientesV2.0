import { getSessionProfile } from '@/services/auth/session'
import { TransactionService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const restored = await TransactionService.restore(id, profile.orgId)
    return NextResponse.json(restored)
  } catch (error) {
    console.error('Error restoring transaction:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao restaurar transação',
      },
      { status: 400 }
    )
  }
}
