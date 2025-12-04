import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest | Request) {
  // Detailed reconciliation listing for manual review
  // Expensive queries kept simple; consider pagination if dataset grows
  const invoicesPaidWithoutLinks = await prisma.invoice.findMany({
    where: {
      status: 'PAID',
      transactions: { none: {} },
    },
    select: { id: true, number: true, clientId: true, total: true },
  })

  // Income finances without invoice linkage (could be manual entries)
  const orphanFinances = await prisma.transaction.findMany({
    where: { type: 'INCOME', invoiceId: null },
    select: {
      id: true,
      amount: true,
      description: true,
      clientId: true,
      date: true,
    },
    orderBy: { date: 'desc' },
    take: 200,
  })

  // Invoices with multiple finance entries (potential duplication)
  const invoicesWithMultipleFinances = await prisma.invoice.findMany({
    where: { transactions: { some: {} } },
    select: {
      id: true,
      number: true,
      clientId: true,
      transactions: { select: { id: true, amount: true } },
    },
  })
  const multiFinanceInvoices = invoicesWithMultipleFinances.filter(
    (i) => i.transactions.length > 1
  )

  const guard = guardAccess(req)
  if (guard) return guard
  const res = NextResponse.json({
    invoicesPaidWithoutLinks,
    orphanFinances,
    multiFinanceInvoices,
  })
  return applySecurityHeaders(req, res)
}
