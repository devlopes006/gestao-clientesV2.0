import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { applySecurityHeaders } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req?: NextRequest) {
  const r: NextRequest = req ?? new NextRequest('http://localhost/api/finance')
  // Rate limit finance queries
  const rl = await checkRateLimit(
    getIdentifier(r as unknown as Request),
    apiRatelimit
  )
  if (!rl.success)
    return applySecurityHeaders(
      r,
      NextResponse.json(
        { error: 'Too many requests', resetAt: rl.reset.toISOString() },
        { status: 429 }
      )
    )
  const { user, orgId, role } = await getSessionProfile()
  if (!user || !orgId)
    return applySecurityHeaders(
      r,
      NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    )
  if (!can(role!, 'read', 'finance'))
    return applySecurityHeaders(
      r,
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    )

  const items = await prisma.transaction.findMany({
    where: {
      orgId,
      deletedAt: null,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  })
  return applySecurityHeaders(r, NextResponse.json(items, { status: 200 }))
}

export async function POST(req: NextRequest) {
  // Rate limit finance mutations
  const rl = await checkRateLimit(
    getIdentifier(req as unknown as Request),
    apiRatelimit
  )
  if (!rl.success)
    return NextResponse.json(
      { error: 'Too many requests', resetAt: rl.reset.toISOString() },
      { status: 429 }
    )
  const body = await req.json()
  const { user, orgId, role } = await getSessionProfile()
  if (!user || !orgId)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!can(role!, 'create', 'finance'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { type, subtype, amount, description, category, clientId, date } =
    body || {}

  if (!type || typeof amount !== 'number')
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  // Validate client if provided
  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client || client.orgId !== orgId)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const effectiveSubtype =
    subtype || (type === 'expense' ? 'OTHER_EXPENSE' : 'OTHER_INCOME')

  const created = await prisma.transaction.create({
    data: {
      type,
      subtype: effectiveSubtype,
      amount,
      description,
      category,
      clientId: clientId || null,
      orgId,
      date: date ? new Date(date) : new Date(),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return NextResponse.json(created, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const rl = await checkRateLimit(
    getIdentifier(req as unknown as Request),
    apiRatelimit
  )
  if (!rl.success)
    return NextResponse.json(
      { error: 'Too many requests', resetAt: rl.reset.toISOString() },
      { status: 429 }
    )

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const { user, orgId, role } = await getSessionProfile()

  if (!user || !orgId)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!can(role!, 'update', 'finance'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const existing = await prisma.transaction.findUnique({
    where: { id },
    include: { client: true },
  })

  if (!existing || existing.orgId !== orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { type, subtype, amount, description, category, clientId, date } = body

  // Validate client if changed
  if (clientId && clientId !== existing.clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client || client.orgId !== orgId)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(subtype && { subtype }),
      ...(typeof amount === 'number' && { amount }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(clientId !== undefined && { clientId }),
      ...(date && { date: new Date(date) }),
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const rl = await checkRateLimit(
    getIdentifier(req as unknown as Request),
    apiRatelimit
  )
  if (!rl.success)
    return NextResponse.json(
      { error: 'Too many requests', resetAt: rl.reset.toISOString() },
      { status: 429 }
    )

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const { user, orgId, role } = await getSessionProfile()

  if (!user || !orgId)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!can(role!, 'delete', 'finance'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const existing = await prisma.transaction.findUnique({
    where: { id },
  })

  if (!existing || existing.orgId !== orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Soft delete by setting deletedAt
  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true }, { status: 200 })
}
