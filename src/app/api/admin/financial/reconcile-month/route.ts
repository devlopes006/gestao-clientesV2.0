import { getSessionProfile } from '@/services/auth/session'
import AdminReconcileService from '@/services/financial/AdminReconcileService'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest | Request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const adminToken = process.env.ADMIN_API_TOKEN || ''
    let orgId: string | undefined
    let body: {
      orgId?: string
      year?: unknown
      month?: unknown
      targetIncome?: unknown
      targetExpense?: unknown
    } = {}
    if (
      authHeader.startsWith('Bearer ') &&
      adminToken &&
      authHeader === `Bearer ${adminToken}`
    ) {
      body = (await request.json()) as {
        orgId?: string
        year?: unknown
        month?: unknown
        targetIncome?: unknown
        targetExpense?: unknown
      }
      orgId = body.orgId || request.headers.get('x-org-id') || undefined
      if (!orgId)
        return NextResponse.json(
          { error: 'orgId obrigatório com ADMIN token' },
          { status: 400 }
        )
    } else {
      const profile = await getSessionProfile()
      if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }
      orgId = profile.orgId
      body = (await request.json()) as {
        year?: unknown
        month?: unknown
        targetIncome?: unknown
        targetExpense?: unknown
      }
    }

    const year = parseInt(String(body.year))
    const month = parseInt(String(body.month))
    const targetIncome =
      typeof body.targetIncome === 'number'
        ? body.targetIncome
        : body.targetIncome != null
          ? Number(body.targetIncome)
          : null
    const targetExpense =
      typeof body.targetExpense === 'number'
        ? body.targetExpense
        : body.targetExpense != null
          ? Number(body.targetExpense)
          : null

    if (!year || !month) {
      return NextResponse.json(
        { error: 'year e month são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await AdminReconcileService.reconcileMonth(
      orgId as string,
      year,
      month,
      targetIncome,
      targetExpense
    )
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error('Error reconciling month:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro na reconciliação',
      },
      { status: 500 }
    )
  }
}
