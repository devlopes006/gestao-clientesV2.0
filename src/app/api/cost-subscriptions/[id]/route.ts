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

    const subscription = await CostTrackingService.getSubscriptionById(
      id,
      profile.orgId
    )

    if (!subscription) {
      return NextResponse.json(
        { error: 'Associação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error getting subscription:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao buscar associação',
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

    const subscription = await CostTrackingService.updateSubscription(
      id,
      profile.orgId,
      {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        active: body.active,
        notes: body.notes,
        updatedBy: profile.user.id,
      }
    )

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar associação',
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

    const subscription = await CostTrackingService.deleteSubscription(
      id,
      profile.orgId,
      profile.user.id
    )

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao deletar associação',
      },
      { status: 400 }
    )
  }
}
