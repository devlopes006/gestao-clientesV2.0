import { getSessionProfile } from '@/services/auth/session'
import { InvoiceService } from '@/services/financial'
import { InvoiceStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const filters = {
      orgId: profile.orgId,
      clientId: searchParams.get('clientId') || undefined,
      status: searchParams.get('status') as InvoiceStatus | undefined,
      dateFrom: searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined,
      dateTo: searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    }

    const pagination = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
    }

    const result = await InvoiceService.list(filters, pagination)

    return NextResponse.json({
      data: result.invoices,
      pagination: result.pagination,
      totalPages: result.pagination.totalPages,
      total: result.pagination.total,
    })
  } catch (error) {
    console.error('Error listing invoices:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao listar faturas',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()

    const invoice = await InvoiceService.create({
      clientId: body.clientId,
      orgId: profile.orgId,
      dueDate: new Date(body.dueDate),
      items: body.items,
      discount: body.discount,
      tax: body.tax,
      notes: body.notes,
      internalNotes: body.internalNotes,
      installmentId: body.installmentId,
      createdBy: profile.user.id,
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao criar fatura',
      },
      { status: 400 }
    )
  }
}
