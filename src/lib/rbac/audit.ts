import { prisma } from '@/lib/prisma'

interface PermissionAuditParams {
  userId?: string
  orgId?: string
  action: string
  resource?: string
  requiredRole?: string
  role?: string
  reason?: string
  metadata?: Record<string, unknown>
}

export async function logPermissionDenied(params: PermissionAuditParams) {
  try {
    await prisma.permissionAudit.create({
      data: {
        userId: params.userId,
        orgId: params.orgId,
        action: params.action,
        resource: params.resource ?? 'unknown',
        reason: params.reason,
        requiredRole: params.requiredRole,
        role: params.role,
        metadata: params.metadata ?? {},
      },
    })
  } catch (error) {
    console.error('[PermissionAudit] failed to log denial', error)
  }
}

export async function getPermissionAuditStats() {
  try {
    const [last24h, total] = await Promise.all([
      prisma.permissionAudit.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.permissionAudit.count(),
    ])

    return { last24h, total }
  } catch (error) {
    console.error('[PermissionAudit] failed to get stats', error)
    return { last24h: 0, total: 0 }
  }
}
