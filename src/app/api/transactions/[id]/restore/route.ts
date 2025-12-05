import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { getSessionProfile } from '@/services/auth/session'
import { TransactionService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit restauração de transação
    const idKey = getIdentifier(_request)
    const rl = await checkRateLimit(idKey, apiRatelimit)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
    }
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
