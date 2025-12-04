import { can, type AppRole } from '@/lib/permissions'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const guard = guardAccess(req)
  if (guard) return guard
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'manage', 'finance'))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Backfill foi removido no novo sistema financeiro
  // Esta é apenas um stub para compatibilidade
  const res = NextResponse.json({
    success: true,
    message: 'Backfill não é necessário no novo sistema financeiro',
    data: {
      processedCount: 0,
      skippedCount: 0,
    },
  })
  return applySecurityHeaders(req, res)
}
