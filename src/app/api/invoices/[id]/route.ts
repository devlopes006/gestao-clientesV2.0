import { getSessionProfile } from '@/services/auth/session'
import { InvoiceService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const invoice = await InvoiceService.getById(id, profile.orgId!)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Fatura não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error getting invoice:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao buscar fatura',
      },
      { status: 500 }
    )
  }
}
