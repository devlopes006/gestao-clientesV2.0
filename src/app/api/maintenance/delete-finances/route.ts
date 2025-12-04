import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Limpeza de financeiro foi movida para o novo sistema financeiro
 * Este endpoint retorna um stub para compatibilidade
 */
export async function POST(req: NextRequest) {
  const guard = guardAccess(req)
  if (guard) return guard

  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const res = NextResponse.json({
    message: 'Operação de limpeza foi movida para o novo sistema financeiro',
    success: true,
    deletedCount: 0,
    skippedCount: 0,
  })

  return applySecurityHeaders(req, res)
}
