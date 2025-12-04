import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

type UpdateItem = {
  id: string
  date?: string // ISO date string
  amount?: number
  type?: 'INCOME' | 'EXPENSE'
  invoiceId?: string | null
}

export async function POST(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as unknown as AppRole, 'update', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  let items: UpdateItem[]
  try {
    items = (await req.json()) as UpdateItem[]
    if (!Array.isArray(items) || items.length === 0)
      throw new Error('Payload deve ser uma lista de updates')
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: 'JSON inválido', detail },
      { status: 400 }
    )
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const item of items) {
    try {
      const data: Partial<{
        date: Date
        amount: number
        type: 'INCOME' | 'EXPENSE'
        invoiceId: string | null
      }> = {}
      if (item.date) data.date = new Date(item.date)
      if (typeof item.amount === 'number') data.amount = item.amount
      if (item.type) data.type = item.type
      if ('invoiceId' in item) data.invoiceId = item.invoiceId ?? null

      if (Object.keys(data).length === 0)
        throw new Error('Nenhum campo para atualizar')

      await prisma.transaction.update({ where: { id: item.id }, data })
      results.push({ id: item.id, ok: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ id: item.id, ok: false, error: message })
    }
  }

  return NextResponse.json({ updated: results })
}
