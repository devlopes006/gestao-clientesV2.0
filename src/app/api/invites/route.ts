import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest | Request) {
  const guard = guardAccess(req)
  if (guard) return guard
  const { user, orgId, role } = await getSessionProfile()
  if (!user || !orgId || !role) {
    const res = NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    return applySecurityHeaders(req, res)
  }

  if (!can(role, 'read', 'invite')) {
    const res = NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    return applySecurityHeaders(req, res)
  }
  const invites = await prisma.invite.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
  })
  return applySecurityHeaders(req, NextResponse.json({ data: invites }))
}
