/**
 * Session Validation Utilities
 *
 * Responsável por validar se um usuário ainda tem acesso durante a sessão.
 * Cenário: Admin removeu user do team mid-session → próximo request retorna 403
 */

import { prisma } from '@/lib/prisma'
import { USER_ROLE, type UserRole } from '@/shared/types/enums'

/**
 * Interface de resposta de validação
 */
export interface ValidationResult {
  valid: boolean
  reason?: 'user_not_found' | 'team_removed' | 'role_revoked' | 'org_deleted'
  user?: {
    id: string
    email: string
    name: string
  }
  org?: {
    id: string
    name: string
  }
}

/**
 * Valida se um usuário ainda tem acesso válido
 *
 * Verifica:
 * 1. User existe no DB
 * 2. User tem um org/team associado
 * 3. User tem um role válido no org
 * 4. Org ainda está ativa
 *
 * @param userId - Firebase UID do usuário
 * @param expectedOrgId - Org ID esperado (da sessão)
 * @returns ValidationResult com status de validade
 */
export async function validateUserAccess(
  userId: string,
  expectedOrgId?: string
): Promise<ValidationResult> {
  try {
    // 1. Verificar se user existe no DB
    const user = await prisma.user.findUnique({
      where: { firebaseUid: userId },
      include: {
        members: {
          include: {
            organization: true,
          },
        },
      },
    })

    if (!user) {
      return {
        valid: false,
        reason: 'user_not_found',
      }
    }

    // 2. Verificar se user tem pelo menos um team/org
    if (!user.members || user.members.length === 0) {
      return {
        valid: false,
        reason: 'team_removed',
      }
    }

    // 3. Se expectedOrgId foi passado, validar que user ainda é membro
    if (expectedOrgId) {
      const orgMembership = user.members.find(
        (m) => m.organization.id === expectedOrgId
      )

      if (!orgMembership) {
        return {
          valid: false,
          reason: 'team_removed',
        }
      }

      // 4. Verificar se org ainda está ativa
      if (!orgMembership.organization || orgMembership.organization.deletedAt) {
        return {
          valid: false,
          reason: 'org_deleted',
        }
      }

      // 5. Verificar se role ainda é válido
      const validRoles = Object.values(USER_ROLE)
      if (!validRoles.includes(orgMembership.role as any)) {
        return {
          valid: false,
          reason: 'role_revoked',
        }
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || 'Unknown',
        },
        org: {
          id: orgMembership.organization.id,
          name: orgMembership.organization.name,
        },
      }
    }

    // Se não há expectedOrgId, apenas validar que user existe e tem memberships
    const primaryOrg = user.members[0]?.organization

    if (!primaryOrg || primaryOrg.deletedAt) {
      return {
        valid: false,
        reason: 'org_deleted',
      }
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown',
      },
      org: {
        id: primaryOrg.id,
        name: primaryOrg.name,
      },
    }
  } catch (error) {
    console.error('[Validation] Error validating user access:', error)
    // Em caso de erro no DB, negamos acesso (fail-safe)
    return {
      valid: false,
      reason: 'user_not_found',
    }
  }
}

/**
 * Valida se um usuário tem um role específico em um org
 *
 * @param userId - Firebase UID do usuário
 * @param orgId - Organization ID
 * @param requiredRole - Role necessário (ex: 'ADMIN')
 * @returns true se user tem o role, false caso contrário
 */
export async function userHasRole(
  userId: string,
  orgId: string,
  requiredRole: UserRole | string
): Promise<boolean> {
  try {
    const member = await prisma.member.findFirst({
      where: {
        userId,
        organization: {
          id: orgId,
          deletedAt: null,
        },
      },
    })

    if (!member) return false
    return member.role === requiredRole || member.role === USER_ROLE.OWNER
  } catch (error) {
    console.error('[Validation] Error checking role:', error)
    return false
  }
}

/**
 * Valida se um usuário tem acesso a um recurso específico (client)
 *
 * @param userId - Firebase UID do usuário
 * @param clientId - Client ID
 * @param orgId - Organization ID
 * @returns true se user tem acesso, false caso contrário
 */
export async function userCanAccessClient(
  userId: string,
  clientId: string,
  orgId: string
): Promise<boolean> {
  try {
    // 1. Verificar se user é membro do org
    const isMember = await prisma.member.findFirst({
      where: {
        userId,
        organization: {
          id: orgId,
          deletedAt: null,
        },
      },
    })

    if (!isMember) return false

    // 2. Se é CLIENT role, verificar se está atribuído ao cliente
    if (isMember.role === USER_ROLE.CLIENT) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          orgId,
          clientUserId: userId,
        },
      })
      return !!client
    }

    // 3. Se é ADMIN/OWNER, verificar que cliente pertence ao org
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        orgId,
      },
    })
    return !!client
  } catch (error) {
    console.error('[Validation] Error validating client access:', error)
    return false
  }
}
