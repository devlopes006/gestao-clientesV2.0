import { cacheInvalidation } from '@/lib/cache'
import { getSessionProfile } from '@/services/auth/session'
import { InvoiceService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
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

    const body = await request.json()

    const invoice = await InvoiceService.cancel(
      id,
      profile.orgId,
      body.reason,
      profile.user.id
    )

    // Invalidate cache after invoice cancellation
    cacheInvalidation.invoices(profile.orgId)

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error cancelling invoice:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao cancelar fatura',
      },
      { status: 400 }
    )
  }
}
