import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest | Request) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'delete', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  let body: {
    start: string
    end: string
    scope?: 'all' | 'finance' | 'payments' | 'invoices'
    dryRun?: boolean
  }
  try {
    body = (await req.json()) as {
      start?: string
      end?: string
      scope?: 'all' | 'finance' | 'payments' | 'invoices'
      dryRun?: boolean
    }
    if (!body.start || !body.end)
      throw new Error('start e end obrigatórios (ISO)')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: 'JSON inválido', detail: msg },
      { status: 400 }
    )
  }

  const start = new Date(body.start)
  const end = new Date(body.end)
  const scope = body.scope || 'all'
  const dryRun = !!body.dryRun

  const summary: Record<string, number> = {}

  // Count phase
  if (scope === 'all' || scope === 'finance') {
    summary['financeCount'] = await prisma.transaction.count({
      where: { orgId, date: { gte: start, lte: end } },
    })
  }
  if (scope === 'all' || scope === 'payments') {
    summary['paymentsCount'] = await prisma.transaction.count({
      where: {
        orgId,
        subtype: 'INVOICE_PAYMENT',
        date: { gte: start, lte: end },
      },
    })
  }
  if (scope === 'all' || scope === 'invoices') {
    summary['invoicesCount'] = await prisma.invoice.count({
      where: { orgId, issueDate: { gte: start, lte: end } },
    })
  }

  if (dryRun) {
    return NextResponse.json({ scope, start, end, dryRun, summary })
  }

  // Delete phase
  if (scope === 'all' || scope === 'finance') {
    await prisma.transaction.deleteMany({
      where: { orgId, date: { gte: start, lte: end } },
    })
  }
  if (scope === 'all' || scope === 'payments') {
    await prisma.transaction.deleteMany({
      where: {
        orgId,
        subtype: 'INVOICE_PAYMENT',
        date: { gte: start, lte: end },
      },
    })
  }
  if (scope === 'all' || scope === 'invoices') {
    await prisma.invoice.deleteMany({
      where: { orgId, issueDate: { gte: start, lte: end } },
    })
  }

  return NextResponse.json({ scope, start, end, deleted: summary })
}
