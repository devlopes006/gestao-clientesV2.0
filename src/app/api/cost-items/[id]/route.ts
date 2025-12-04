import { getSessionProfile } from '@/services/auth/session'
import { CostTrackingService } from '@/services/financial'
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

    const item = await CostTrackingService.getCostItemById(id, profile.orgId)

    if (!item) {
      return NextResponse.json(
        { error: 'Item de custo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error getting cost item:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar item de custo',
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

    const item = await CostTrackingService.updateCostItem(id, profile.orgId, {
      name: body.name,
      description: body.description,
      amount: body.amount,
      category: body.category,
      active: body.active,
      updatedBy: profile.user.id,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating cost item:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar item de custo',
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

    const item = await CostTrackingService.deleteCostItem(
      id,
      profile.orgId,
      profile.user.id
    )

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error deleting cost item:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao deletar item de custo',
      },
      { status: 400 }
    )
  }
}
