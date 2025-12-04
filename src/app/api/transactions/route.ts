import { getSessionProfile } from '@/services/auth/session'
import { TransactionService } from '@/services/financial'
import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '@prisma/client'
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
      type: searchParams.get('type') as TransactionType | undefined,
      subtype: searchParams.get('subtype') as TransactionSubtype | undefined,
      status: searchParams.get('status') as TransactionStatus | undefined,
      clientId: searchParams.get('clientId') || undefined,
      invoiceId: searchParams.get('invoiceId') || undefined,
      costItemId: searchParams.get('costItemId') || undefined,
      category: searchParams.get('category') || undefined,
      dateFrom: searchParams.get('dateFrom')
        ? new Date(searchParams.get('dateFrom')!)
        : undefined,
      dateTo: searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')!)
        : undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    }

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      orderBy: (searchParams.get('orderBy') || 'date') as
        | 'date'
        | 'amount'
        | 'createdAt',
      orderDirection: (searchParams.get('orderDirection') || 'desc') as
        | 'asc'
        | 'desc',
    }

    const result = await TransactionService.list(filters, pagination)

    // Formatar resposta com clientName diretamente do include
    const transactionsWithClientNames = result.transactions.map(
      (transaction) => ({
        ...transaction,
        clientName: transaction.client?.name || null,
      })
    )

    return NextResponse.json({
      data: transactionsWithClientNames,
      pagination: result.pagination,
      totalPages: result.pagination.totalPages,
      total: result.pagination.total,
    })
  } catch (error) {
    console.error('Error listing transactions:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao listar transações',
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

    const transaction = await TransactionService.create({
      type: body.type,
      subtype: body.subtype,
      amount: body.amount,
      description: body.description,
      category: body.category,
      date: body.date ? new Date(body.date) : undefined,
      status: body.status,
      invoiceId: body.invoiceId,
      clientId: body.clientId,
      costItemId: body.costItemId,
      metadata: body.metadata,
      orgId: profile.orgId,
      createdBy: profile.user.id,
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao criar transação',
      },
      { status: 400 }
    )
  }
}
