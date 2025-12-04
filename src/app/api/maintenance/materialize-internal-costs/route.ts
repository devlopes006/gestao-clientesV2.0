import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

type CostMaterializationItem = {
  clientId: string
  amount: number
  month: string // YYYY-MM
  description?: string
}

export async function POST(req: NextRequest | Request) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'create', 'finance'))
    return NextResponse.json({ error: 'Proibido' }, { status: 403 })

  let items: CostMaterializationItem[]
  try {
    items = (await req.json()) as CostMaterializationItem[]
    if (!Array.isArray(items) || items.length === 0)
      throw new Error('Payload deve ser uma lista de custos')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: 'JSON inválido', detail: msg },
      { status: 400 }
    )
  }

  const results: Array<{
    clientId: string
    ok: boolean
    error?: string
    financeId?: string
  }> = []

  for (const item of items) {
    try {
      const [y, m] = item.month.split('-').map(Number)
      const date = new Date(y, m - 1, 1)

      const finance = await prisma.transaction.create({
        data: {
          orgId,
          clientId: item.clientId,
          type: 'EXPENSE',
          subtype: 'INTERNAL_COST',
          category: 'CUSTO_INTERNO',
          description: item.description || `Custo interno ${item.month}`,
          amount: item.amount,
          date,
        },
      })
      results.push({ clientId: item.clientId, ok: true, financeId: finance.id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ clientId: item.clientId, ok: false, error: msg })
    }
  }

  return NextResponse.json({ created: results })
}
