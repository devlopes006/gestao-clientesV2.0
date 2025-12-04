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
      active:
        searchParams.get('active') === 'true'
          ? true
          : searchParams.get('active') === 'false'
            ? false
            : undefined,
      category: searchParams.get('category') || undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    }

    const items = await CostTrackingService.listCostItems(filters)
    return NextResponse.json({
      data: items,
      totalPages: 1,
      total: items.length,
    })
  } catch (error) {
    console.error('Error listing cost items:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao listar itens de custo',
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

    const item = await CostTrackingService.createCostItem({
      name: body.name,
      description: body.description,
      amount: body.amount,
      category: body.category,
      active: body.active,
      orgId: profile.orgId,
      createdBy: profile.user.id,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating cost item:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao criar item de custo',
      },
      { status: 400 }
    )
  }
}
