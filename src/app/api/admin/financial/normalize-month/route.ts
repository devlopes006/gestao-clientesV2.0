import { getSessionProfile } from '@/services/auth/session'
import { AdminFinancialService } from '@/services/financial/AdminFinancialService'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest | Request) {
  try {
    // Allow OWNER session OR admin token with orgId header/body
    const authHeader = request.headers.get('authorization') || ''
    const adminToken = process.env.ADMIN_API_TOKEN || ''
    let orgId: string | undefined
    let body: { orgId?: string; year?: unknown; month?: unknown } = {}
    if (
      authHeader.startsWith('Bearer ') &&
      adminToken &&
      authHeader === `Bearer ${adminToken}`
    ) {
      body = (await request.json()) as {
        orgId?: string
        year?: unknown
        month?: unknown
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
      body = (await request.json()) as { year?: unknown; month?: unknown }
    }

    const year = parseInt(String(body.year))
    const month = parseInt(String(body.month))

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Ex: { "year": 2025, "month": 10 }' },
        { status: 400 }
      )
    }

    const result = await AdminFinancialService.normalizeMonth(
      orgId as string,
      year,
      month
    )

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error('Error normalizing month:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao normalizar mês',
      },
      { status: 500 }
    )
  }
}
