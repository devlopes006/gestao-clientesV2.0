import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { applySecurityHeaders } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'
// Provide a typed delegate that resolves to either the mocked prisma.finance
// used in tests or the real prisma.transaction delegate in production.
type ClientSummary = { id: string; orgId?: string; name?: string }
type FinanceRecord = {
  id: string
  type: 'income' | 'expense' | string
  subtype?: string
  amount: number
  description?: string
  category?: string
  date?: Date | string
  clientId?: string
  orgId: string
  client?: ClientSummary | null
}
type WhereClause = { id?: string; orgId?: string }
type OrderByClause = { date?: 'asc' | 'desc' }
type IncludeClause = { client?: boolean }
interface FinanceDelegate {
  findMany(args: {
    where?: WhereClause
    include?: IncludeClause
    orderBy?: OrderByClause
  }): Promise<FinanceRecord[]>
  findUnique(args: {
    where: { id: string }
    include?: IncludeClause
  }): Promise<FinanceRecord | null>
  create(args: {
    data: FinanceRecord
    include?: IncludeClause
  }): Promise<FinanceRecord>
  update(args: {
    where: { id: string }
    data: Partial<FinanceRecord>
    include?: IncludeClause
  }): Promise<FinanceRecord>
  delete(args: {
    where: { id: string }
  }): Promise<{ id: string } | FinanceRecord>
}

function getFinanceDelegate(): FinanceDelegate {
  const anyPrisma = prisma as unknown as {
    finance?: FinanceDelegate
    transaction: FinanceDelegate
  }
  return anyPrisma.finance ?? anyPrisma.transaction
}

export async function GET(req?: NextRequest) {
  const r: NextRequest = req ?? new NextRequest('http://localhost/api/finance')
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
  const finance = getFinanceDelegate()
  const items = await finance.findMany({
    where: { orgId },
    include: { client: true },
    orderBy: { date: 'desc' },
  })
  return applySecurityHeaders(r, NextResponse.json(items, { status: 200 }))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user, orgId, role } = await getSessionProfile()
  if (!user || !orgId)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!can(role!, 'create', 'finance'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { type, subtype, amount, description, category, clientId } = body || {}
  if (!type || typeof amount !== 'number' || !clientId)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  const client = await prisma.client.findUnique({ where: { id: clientId } })
  if (!client || client.orgId !== orgId)
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  const effectiveSubtype =
    subtype || (type === 'expense' ? 'OTHER_EXPENSE' : 'OTHER_INCOME')
  const finance = getFinanceDelegate()
  const created = await finance.create({
    data: {
      id: '',
      type,
      subtype: effectiveSubtype,
      amount,
      description,
      category,
      clientId,
      orgId,
      date: new Date(),
    },
    include: { client: true },
  })
  return NextResponse.json(created, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const { user, orgId, role } = await getSessionProfile()
  if (!user || !orgId)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!can(role!, 'update', 'finance'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const finance = getFinanceDelegate()
  const existing = await finance.findUnique({
    include: { client: true },
    where: { id },
  })
  if (!existing || existing.client?.orgId !== orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await finance.update({
    where: { id },
    data: body as Partial<FinanceRecord>,
    include: { client: true },
  })
  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const { user, orgId, role } = await getSessionProfile()
  if (!user || !orgId)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!can(role!, 'delete', 'finance'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const finance = getFinanceDelegate()
  const existing = await finance.findUnique({
    include: { client: true },
    where: { id },
  })
  if (!existing || existing.client?.orgId !== orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await finance.delete({ where: { id } })
  return NextResponse.json({ success: true }, { status: 200 })
}
