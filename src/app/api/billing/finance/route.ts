import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    console.log('[finance:get] Starting request')
    const { orgId, role } = await getSessionProfile()
    console.log('[finance:get] Session:', { orgId, role })

    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!can(role as AppRole, 'read', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || undefined // 'income' | 'expense'
    const q = url.searchParams.get('q') || undefined
    const category = url.searchParams.get('category') || undefined
    const from = url.searchParams.get('from')
      ? new Date(url.searchParams.get('from') as string)
      : undefined
    const to = url.searchParams.get('to')
      ? new Date(url.searchParams.get('to') as string)
      : undefined
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const pageSize = Math.max(
      1,
      Math.min(100, Number(url.searchParams.get('pageSize') || '20'))
    )

    const where: Prisma.FinanceWhereInput = { orgId }
    if (type) where.type = type
    if (category) where.category = { contains: category, mode: 'insensitive' }
    if (q) {
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (from || to) where.date = { gte: from, lte: to }

    const skip = (page - 1) * pageSize
    console.log('[finance:get] Querying DB:', { skip, take: pageSize, where })

    const [items, total] = await Promise.all([
      prisma.finance.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          category: true,
          date: true,
          clientId: true,
          createdAt: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.finance.count({ where }),
    ])

    console.log('[finance:get] Success:', { total, itemsCount: items.length })
    return NextResponse.json({ items, total, page, pageSize })
  } catch (error) {
    console.error('[finance:get] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[finance:post] Starting request')
    const { orgId, role } = await getSessionProfile()
    console.log('[finance:post] Session:', { orgId, role })

    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!can(role as AppRole, 'create', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    let body
    try {
      const rawBody = await req.text()
      console.log('[finance:post] Raw body:', rawBody)
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('[finance:post] JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON format', details: String(parseError) },
        { status: 400 }
      )
    }

    console.log('[finance:post] Parsed body:', body)

    const { type, amount, description, category, date, clientId } = body || {}

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Campo "type" é obrigatório' },
        { status: 400 }
      )
    }

    if (!amount || amount === '' || amount === '-') {
      return NextResponse.json(
        { error: 'Campo "amount" é obrigatório e deve ser um número válido' },
        { status: 400 }
      )
    }

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json(
        {
          error: 'Amount deve ser um número válido diferente de zero',
          receivedAmount: amount,
        },
        { status: 400 }
      )
    }

    const created = await prisma.finance.create({
      data: {
        orgId,
        clientId: clientId || null,
        type,
        amount: numAmount,
        description: description || null,
        category: category || null,
        date: date ? new Date(date) : new Date(),
      },
    })

    console.log('[finance:post] Success:', { financeId: created.id })
    return NextResponse.json({ success: true, finance: created })
  } catch (error) {
    console.error('[finance:post] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
