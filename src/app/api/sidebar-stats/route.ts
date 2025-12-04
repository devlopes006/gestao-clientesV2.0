import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest | Request) {
  try {
    const r = (req as NextRequest) ?? (req as Request)
    const guard = guardAccess(r)
    if (guard) return guard
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return applySecurityHeaders(
        r,
        NextResponse.json({ orgName: null, role: null, alertsCount: 0 })
      )

    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { name: true },
    })
    let alertsCount = 0
    try {
      // Contar faturas vencidas como alertas financeiros
      const overdueInvoices = await prisma.invoice.count({
        where: {
          orgId,
          status: 'OVERDUE',
          deletedAt: null,
        },
      })
      alertsCount = overdueInvoices
    } catch {
      alertsCount = 0
    }

    const res = NextResponse.json({
      orgName: org?.name ?? null,
      role,
      alertsCount,
    })
    return applySecurityHeaders(r, res)
  } catch {
    return applySecurityHeaders(
      (req as NextRequest) ?? (req as Request),
      NextResponse.json({ orgName: null, role: null, alertsCount: 0 })
    )
  }
}
