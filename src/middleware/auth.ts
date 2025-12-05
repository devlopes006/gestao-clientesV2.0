import { NextRequest } from 'next/server'

export interface AuthContext {
  orgId?: string
  userId?: string
  roles?: string[]
}

// Resolve orgId from authenticated session (Firebase, JWT) or secure header fallback
export function getAuthContext(req: NextRequest): AuthContext {
  // Header fallback (to be removed in prod): x-org-id
  const headerOrg = req.headers.get('x-org-id') || undefined

  // TODO: Integrate with Firebase/JWT session extraction
  // Example:
  // const token = req.headers.get('authorization')?.replace('Bearer ', '')
  // const session = await verifyToken(token)
  // const orgId = session?.orgId

  return {
    orgId: headerOrg,
  }
}

// Simple role check (placeholder)
export function hasRole(ctx: AuthContext, role: string): boolean {
  return Array.isArray(ctx.roles) ? ctx.roles.includes(role) : false
}
