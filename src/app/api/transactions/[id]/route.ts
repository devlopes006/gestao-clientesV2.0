import { getSessionProfile } from '@/services/auth/session'
import { TransactionService } from '@/services/financial'
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
    const transaction = await TransactionService.getById(id, profile.orgId)

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error getting transaction:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao buscar transação',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    const transaction = await TransactionService.update(id, profile.orgId, {
      type: body.type,
      subtype: body.subtype,
      amount: body.amount,
      description: body.description,
      category: body.category,
      date: body.date ? new Date(body.date) : undefined,
      status: body.status,
      metadata: body.metadata,
      updatedBy: profile.user.id,
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar transação',
      },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const transaction = await TransactionService.delete(
      id,
      profile.orgId,
      profile.user.id
    )

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao deletar transação',
      },
      { status: 400 }
    )
  }
}
