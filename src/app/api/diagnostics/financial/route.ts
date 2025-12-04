import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

/**
 * API de diagnóstico do sistema financeiro
 */
export async function GET() {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const orgId = profile.orgId

    // Contar registros
    const counts = {
      clients: await prisma.client.count({ where: { orgId } }),
      invoices: await prisma.invoice.count({ where: { orgId } }),
      transactions: await prisma.transaction.count({ where: { orgId } }),
      recurringExpenses: await prisma.recurringExpense.count({
        where: { orgId },
      }),
    }

    // Clientes com parcelamento
    const installmentClients = await prisma.client.findMany({
      where: { orgId, isInstallment: true },
      select: {
        id: true,
        name: true,
        installmentCount: true,
        installmentValue: true,
        installmentPaymentDays: true,
        contractValue: true,
      },
      take: 10,
    })

    // Últimas faturas
    const recentInvoices = await prisma.invoice.findMany({
      where: { orgId },
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        dueDate: true,
        notes: true,
        client: { select: { name: true, isInstallment: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Últimas transações
    const recentTransactions = await prisma.transaction.findMany({
      where: { orgId },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        status: true,
        client: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      counts,
      installmentClients: {
        count: installmentClients.length,
        samples: installmentClients,
      },
      recentInvoices,
      recentTransactions,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in diagnostics:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro no diagnóstico',
      },
      { status: 500 }
    )
  }
}
