import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

/**
 * Endpoint de teste de ciclo foi movido para o novo sistema financeiro
 * Use as APIs específicas em vez deste endpoint consolidado
 */
export async function POST() {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      message:
        'Testes de ciclo foram movidos para APIs específicas do novo sistema',
      status: 'migrated',
      newApiEndpoints: {
        generateInvoices: 'POST /api/invoices/generate-monthly',
        materializeCosts: 'POST /api/cost-subscriptions/materialize',
        getTransactions: 'GET /api/transactions',
        getInvoices: 'GET /api/invoices',
      },
      docs: '/docs/FINANCEIRO_COMPLETO.md',
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao executar testes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
