/**
 * Exemplos de Uso - Session Validation & Protected Routes
 *
 * Este arquivo documenta como usar withAuth e withAuthRole em rotas API.
 */

/**
 * EXEMPLO 1: Rota Básica Protegida
 *
 * Requer autenticação válida (user existe e tem acesso)
 * Retorna 401 se não autenticado
 * Retorna 403 se acesso foi revogado
 */
/*
import { withAuth } from '@/app/api/session/with-auth'
import { NextResponse } from 'next/server'

export const GET = withAuth(async (req, { user, orgId, validation }) => {
  // Aqui você sabe que:
  // - User está autenticado
  // - User ainda é membro do org
  // - Org ainda existe

  return NextResponse.json({
    message: 'Welcome!',
    user: { id: user.id, email: user.email },
    org: validation.org,
  })
})
*/

/**
 * EXEMPLO 2: Rota com Validação de Role
 *
 * Requer autenticação + role específico
 * Retorna 403 se user não é ADMIN ou OWNER
 */
/*
import { withAuthRole } from '@/app/api/session/with-auth'
import { NextResponse } from 'next/server'

export const DELETE = withAuthRole('ADMIN', async (req, { user, orgId }) => {
  // Apenas ADMIN ou OWNER chegam aqui

  return NextResponse.json({
    message: 'Only admins can delete',
    deletedBy: user.id,
  })
})
*/

/**
 * EXEMPLO 3: Validação Manual (mais controle)
 *
 * Quando você quer mais controle sobre o fluxo
 */
/*
import { getSessionProfile } from '@/services/auth/session'
import { validateUserAccess, userHasRole } from '@/app/api/session/validate'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // 1. Validar sessão
  const { user, orgId } = await getSessionProfile()
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validar acesso
  const validation = await validateUserAccess(user.id, orgId)
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Access denied', reason: validation.reason },
      { status: 403 }
    )
  }

  // 3. Validar role específico se necessário
  const isAdmin = await userHasRole(user.id, orgId, 'ADMIN')
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  // Handler continua com user validado
  return NextResponse.json({ ok: true })
}
*/

/**
 * EXEMPLO 4: Validar Acesso a Recurso Específico
 *
 * Validar se user pode acessar um cliente específico
 */
/*
import { validateUserAccess, userCanAccessClient } from '@/app/api/session/validate'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  // 1. Validar sessão
  const { user, orgId } = await getSessionProfile()
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validar acesso geral
  const validation = await validateUserAccess(user.id, orgId)
  if (!validation.valid) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // 3. Validar acesso específico ao cliente
  const canAccess = await userCanAccessClient(
    user.id,
    params.clientId,
    orgId
  )
  if (!canAccess) {
    return NextResponse.json(
      { error: 'Cannot access this client' },
      { status: 403 }
    )
  }

  // Handler continua
  return NextResponse.json({ ok: true })
}
*/

/**
 * FLUXO DE VALIDAÇÃO
 *
 * ```
 * Request → withAuth()
 *   ├─ getSessionProfile() → Valida ID token
 *   │  ├─ Se erro → 401 Unauthorized
 *   │  └─ Se OK → continua
 *   │
 *   ├─ validateUserAccess() → Verifica DB
 *   │  ├─ User não existe → 403 (user_not_found)
 *   │  ├─ User removido do team → 403 (team_removed)
 *   │  ├─ Team deletado → 403 (org_deleted)
 *   │  ├─ Role revogado → 403 (role_revoked)
 *   │  └─ Tudo OK → continua
 *   │
 *   └─ handler() → Executa lógica
 *      └─ Response
 * ```
 */

/**
 * CENÁRIOS DE TESTE
 *
 * 1. User fazendo request normal
 *    → withAuth valida
 *    → handler executa
 *    → retorna 200
 *
 * 2. User com ID token expirado
 *    → getSessionProfile falha
 *    → retorna 401
 *    → Cliente tenta refresh
 *
 * 3. Admin removeu user do team mid-session
 *    → ID token ainda válido
 *    → validateUserAccess encontra team_removed
 *    → retorna 403
 *    → Cliente redireciona para /login
 *
 * 4. User tenta acessar sem role ADMIN
 *    → withAuthRole verifica role
 *    → role não é ADMIN
 *    → retorna 403
 */

export {}
