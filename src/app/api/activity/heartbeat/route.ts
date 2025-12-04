import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    const { user } = await getSessionProfile()
    if (!user)
      return applySecurityHeaders(
        req,
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })
    return applySecurityHeaders(req, NextResponse.json({ ok: true }))
  } catch (e) {
    console.error('[activity/heartbeat] failed', e)
    return applySecurityHeaders(
      req,
      NextResponse.json({ error: 'Failed' }, { status: 500 })
    )
  }
}
