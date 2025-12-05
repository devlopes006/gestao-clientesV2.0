/**
 * RBAC Protection Middleware
 *
 * Validates user permissions for API endpoints and actions
 */

import { AuditAction, createAuditLog } from '@/lib/audit/trail'
import { hasPermission, Permission, UserRole } from '@/lib/rbac/permissions'
import { NextRequest, NextResponse } from 'next/server'

/**
 * User context extracted from request
 */
export interface UserContext {
  id: string
  organizationId: string
  email: string
  role: UserRole
  ipAddress?: string
  userAgent?: string
}

/**
 * Extract user context from request
 */
export async function extractUserContext(
  request: NextRequest
): Promise<UserContext | null> {
  try {
    // Get user from session/auth header
    const userId = request.headers.get('x-user-id')
    const { orgId: organizationId } = await import('@/middleware/auth').then(
      (m) => m.getAuthContext(request)
    )
    const email = request.headers.get('x-user-email')
    const role = request.headers.get('x-user-role') as UserRole

    if (!userId || !organizationId || !email || !role) {
      return null
    }

    // Extract IP from headers (x-forwarded-for is set by proxies)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : undefined

    return {
      id: userId,
      organizationId,
      email,
      role,
      ipAddress,
      userAgent: request.headers.get('user-agent') || undefined,
    }
  } catch (error) {
    console.error('Failed to extract user context:', error)
    return null
  }
}

/**
 * Middleware to check if user has required permission
 */
export async function requirePermission(permission: Permission) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const user = await extractUserContext(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication' },
        { status: 401 }
      )
    }

    if (!hasPermission(user.role, permission)) {
      // Log permission denied
      try {
        await createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: AuditAction.PERMISSION_DENIED,
          resourceType: 'api_endpoint',
          resourceId: new URL(request.url).pathname,
          ipAddress: user.ipAddress,
          userAgent: user.userAgent,
          timestamp: new Date(),
          metadata: {
            requiredPermission: permission,
            userRole: user.role,
          },
        })
      } catch (error) {
        console.error('Failed to log permission denial:', error)
      }

      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    return null
  }
}

/**
 * Middleware to check multiple permissions (requires all)
 */
export async function requireAllPermissions(permissions: Permission[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const user = await extractUserContext(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication' },
        { status: 401 }
      )
    }

    const authorized = permissions.every((permission) =>
      hasPermission(user.role, permission)
    )

    if (!authorized) {
      try {
        await createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: AuditAction.PERMISSION_DENIED,
          resourceType: 'api_endpoint',
          resourceId: new URL(request.url).pathname,
          ipAddress: user.ipAddress,
          userAgent: user.userAgent,
          timestamp: new Date(),
          metadata: {
            requiredPermissions: permissions,
            userRole: user.role,
          },
        })
      } catch (error) {
        console.error('Failed to log permission denial:', error)
      }

      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    return null
  }
}

/**
 * Middleware to check if user belongs to organization
 */
export async function requireOrganizationMembership(organizationId: string) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const user = await extractUserContext(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication' },
        { status: 401 }
      )
    }

    if (user.organizationId !== organizationId) {
      try {
        await createAuditLog({
          organizationId: user.organizationId,
          userId: user.id,
          action: AuditAction.UNAUTHORIZED_ACCESS,
          resourceType: 'organization',
          resourceId: organizationId,
          ipAddress: user.ipAddress,
          userAgent: user.userAgent,
          timestamp: new Date(),
          metadata: {
            requestedOrg: organizationId,
            userOrg: user.organizationId,
          },
        })
      } catch (error) {
        console.error('Failed to log unauthorized access:', error)
      }

      return NextResponse.json(
        { error: 'Forbidden: Organization mismatch' },
        { status: 403 }
      )
    }

    return null
  }
}

/**
 * Format user context for logging
 */
export function formatUserForAudit(user: UserContext): string {
  return `${user.email} (${user.id})`
}

/**
 * Check if user is organization admin
 */
export function isOrgAdmin(user: UserContext): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN
}

/**
 * Check if user is organization owner (super admin)
 */
export function isOrgOwner(user: UserContext): boolean {
  return user.role === UserRole.SUPER_ADMIN
}
