import { can, type AppRole } from '@/lib/permissions'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

/**
 * Endpoint de materialização de custos foi movido para o novo sistema
 * Use a nova API: POST /api/cost-subscriptions/materialize
 */
export async function POST() {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!can(role as unknown as AppRole, 'create', 'finance')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      message: 'Endpoint foi migrado para o novo sistema financeiro',
      status: 'migrated',
      newEndpoint: 'POST /api/cost-subscriptions/materialize',
      docs: '/docs/FINANCEIRO_COMPLETO.md',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
