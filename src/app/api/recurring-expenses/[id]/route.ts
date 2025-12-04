import { getSessionProfile } from '@/services/auth/session'
import { RecurringExpenseService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const expense = await RecurringExpenseService.getById(id, profile.orgId)

    if (!expense) {
      return NextResponse.json(
        { error: 'Despesa fixa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error getting recurring expense:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar despesa fixa',
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

    const expense = await RecurringExpenseService.update(id, profile.orgId, {
      name: body.name,
      description: body.description,
      amount: body.amount,
      category: body.category,
      cycle: body.cycle,
      dayOfMonth: body.dayOfMonth,
      active: body.active,
      updatedBy: profile.user.id,
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error updating recurring expense:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar despesa fixa',
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

    const expense = await RecurringExpenseService.delete(
      id,
      profile.orgId,
      profile.user.id
    )

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error deleting recurring expense:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao deletar despesa fixa',
      },
      { status: 400 }
    )
  }
}
