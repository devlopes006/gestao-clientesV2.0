import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { RecurringExpenseService } from '@/services/financial'
import { ExpenseCycle } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest | Request) {
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
      cycle: searchParams.get('cycle') as ExpenseCycle | undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true',
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get('limit') || '20', 10))
    )
    const skip = (page - 1) * limit
    const search = (searchParams.get('search') || '').trim()

    const where: {
      orgId: string
      active?: boolean
      cycle?: ExpenseCycle
      deletedAt?: null
      name?: { contains: string; mode: 'insensitive' }
    } = {
      orgId: filters.orgId,
      ...(filters.active !== undefined && { active: filters.active }),
      ...(filters.cycle && { cycle: filters.cycle }),
      ...(filters.includeDeleted ? {} : { deletedAt: null }),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.recurringExpense.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.recurringExpense.count({ where }),
    ])

    return NextResponse.json({
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error listing recurring expenses:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao listar despesas fixas',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest | Request) {
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

    const raw = await request.json()

    // Normalização/validação leve para evitar erros de tipagem nos envios do frontend
    const parsedCycle: ExpenseCycle =
      typeof raw.cycle === 'string' && raw.cycle.toUpperCase() === 'ANNUAL'
        ? ExpenseCycle.ANNUAL
        : ExpenseCycle.MONTHLY

    const amount = Number(raw.amount)
    const dayRaw = raw.dayOfMonth
    const dayOfMonth =
      dayRaw == null || (typeof dayRaw === 'string' && dayRaw.trim() === '')
        ? undefined
        : Number(dayRaw)
    if (!raw.name || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Nome e valor (> 0) são obrigatórios' },
        { status: 400 }
      )
    }

    const expense = await RecurringExpenseService.create({
      name: String(raw.name),
      description: raw.description ? String(raw.description) : undefined,
      amount,
      category: raw.category ? String(raw.category) : undefined,
      cycle: parsedCycle,
      dayOfMonth,
      active: raw.active !== undefined ? Boolean(raw.active) : true,
      orgId: profile.orgId,
      createdBy: profile.user.id,
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring expense:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao criar despesa fixa',
      },
      { status: 400 }
    )
  }
}
