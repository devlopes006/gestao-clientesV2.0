import { getSessionProfile } from '@/services/auth/session'
import { ReportingService } from '@/services/financial'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Allow OWNER session OR an admin token with explicit orgId header/query
    const authHeader = request.headers.get('authorization') || ''
    const adminToken = process.env.ADMIN_API_TOKEN || ''
    let orgId: string | undefined
    if (
      authHeader.startsWith('Bearer ') &&
      adminToken &&
      authHeader === `Bearer ${adminToken}`
    ) {
      // token auth: read orgId from query param or header
      const url = new URL(request.url)
      orgId =
        url.searchParams.get('orgId') ||
        request.headers.get('x-org-id') ||
        undefined
      if (!orgId) {
        return NextResponse.json(
          { error: 'orgId é obrigatório quando usando ADMIN token' },
          { status: 400 }
        )
      }
    } else {
      const profile = await getSessionProfile()
      if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }
      orgId = profile.orgId
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(
      searchParams.get('year') || new Date().getFullYear().toString()
    )
    const monthsParam = searchParams.get('months') || ''
    const months = monthsParam
      .split(',')
      .map((m) => parseInt(m.trim()))
      .filter((m) => !isNaN(m) && m >= 1 && m <= 12)

    if (months.length === 0) {
      return NextResponse.json(
        { error: 'Parâmetro months é obrigatório. Ex: months=10,11' },
        { status: 400 }
      )
    }

    const report = await ReportingService.auditFinancial(
      orgId as string,
      year,
      months
    )

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error running audit:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro na auditoria',
      },
      { status: 500 }
    )
  }
}
