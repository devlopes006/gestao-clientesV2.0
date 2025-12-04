import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Análise de setembro foi movida para o novo sistema financeiro
 * Este endpoint retorna um stub para compatibilidade
 */
export async function GET(req: NextRequest) {
  const guard = guardAccess(req)
  if (guard) return guard

  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const res = NextResponse.json({
    message: 'Análise de setembro foi movida para /api/reports/monthly',
    redirect: '/api/reports/monthly',
    data: null,
  })

  return applySecurityHeaders(req, res)
}
