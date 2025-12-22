/**
 * Protected Route Wrapper
 *
 * Wrapper para rotas API que requerem validação de permissões.
 * Valida se user ainda tem acesso antes de executar handler.
 *
 * Exemplo:
 * ```typescript
 * export const GET = withAuth(async (req, { user, orgId }) => {
 *   // Handler aqui sabe que user tem acesso válido
 *   return NextResponse.json({ ok: true })
 * })
 * ```
 */

import { logPermissionDenied } from '@/lib/rbac/audit'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'
import { validateUserAccess, ValidationResult } from './validate'

/**
 * Contexto de autenticação disponível no handler
 */
export interface AuthContext {
  user: {
    id: string
    firebaseUid: string
    email: string
    name: string
  }
  orgId: string
  role: string
  validation: ValidationResult
}

/**
 * Tipo para handler protegido
 */
export type ProtectedHandler = (
  req: NextRequest,
  context: AuthContext
) => Promise<Response>

/**
 * Wrapper que valida autenticação e permissões
 *
 * Fluxo:
 * 1. Obtém sessão (valida ID token)
 * 2. Valida permissões no DB (user/org ainda existem)
 * 3. Se OK: executa handler
 * 4. Se falha: retorna 401 (não autenticado) ou 403 (sem permissão)
 *
 * @param handler - Function que recebe request + auth context
 * @returns Express-like handler
 */
export function withAuth(handler: ProtectedHandler) {
  return async (req: NextRequest) => {
    try {
      // 1. Validar sessão (ID token)
      const { user, orgId, role } = await getSessionProfile()

      if (!user || !orgId) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }

      // 2. Validar permissões no DB
      const validation = await validateUserAccess(user.id, orgId)

      if (!validation.valid) {
        console.warn(
          `[Auth] User ${user.id} access revoked: ${validation.reason}`
        )

        await logPermissionDenied({
          userId: user.id,
          orgId,
          action: 'SESSION_VALIDATE',
          resource: req.nextUrl.pathname,
          reason: validation.reason,
          role: role || 'UNKNOWN',
          metadata: { stage: 'withAuth' },
        })

        return NextResponse.json(
          {
            error: 'Access denied',
            reason: validation.reason,
          },
          { status: 403 }
        )
      }

      // 3. Executar handler com contexto de auth
      const context: AuthContext = {
        user: {
          id: user.id,
          firebaseUid: user.id, // user.id aqui é o Firebase UID
          email: user.email,
          name: user.name || 'Unknown',
        },
        orgId,
        role: role || 'UNKNOWN',
        validation,
      }

      return await handler(req, context)
    } catch (error) {
      console.error('[Auth] Wrapper error:', error)

      // Erros não esperados → 500
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Wrapper com validação de role específico
 *
 * Exemplo:
 * ```typescript
 * export const DELETE = withAuthRole('ADMIN', async (req, context) => {
 *   // Handler executa apenas se user é ADMIN ou OWNER
 *   return NextResponse.json({ ok: true })
 * })
 * ```
 */
export function withAuthRole(requiredRole: string, handler: ProtectedHandler) {
  return withAuth(async (req, context) => {
    // Validar role
    const isOwner = context.role === 'OWNER'
    const hasRequiredRole = context.role === requiredRole

    if (!isOwner && !hasRequiredRole) {
      await logPermissionDenied({
        userId: context.user.id,
        orgId: context.orgId,
        action: 'ROLE_CHECK',
        resource: req.nextUrl.pathname,
        reason: 'insufficient_role',
        requiredRole,
        role: context.role,
      })

      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          required: requiredRole,
          current: context.role,
        },
        { status: 403 }
      )
    }

    return await handler(req, context)
  })
}
