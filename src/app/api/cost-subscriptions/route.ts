import { getSessionProfile } from '@/services/auth/session'
import { CostTrackingService } from '@/services/financial'
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
      costItemId: searchParams.get('costItemId') || undefined,
      active:
        searchParams.get('active') === 'true'
          ? true
          : searchParams.get('active') === 'false'
            ? false
            : undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    }

    const subscriptions = await CostTrackingService.listSubscriptions(filters)

    // Retornar estrutura paginada esperada pelo frontend
    return NextResponse.json({
      data: subscriptions,
      totalPages: 1,
      currentPage: 1,
      totalItems: subscriptions.length,
    })
  } catch (error) {
    console.error('Error listing subscriptions:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao listar associações',
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

    const subscription = await CostTrackingService.createSubscription({
      clientId: body.clientId,
      costItemId: body.costItemId,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      active: body.active,
      notes: body.notes,
      orgId: profile.orgId,
      createdBy: profile.user.id,
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao criar associação',
      },
      { status: 400 }
    )
  }
}
