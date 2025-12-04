import { prisma } from '@/lib/prisma'

export class PaymentOrchestrator {
  /**
   * Registra pagamento consolidando Invoice, Payment, Finance e Client.paymentStatus.
   * Sempre vincula `Finance.invoiceId` para evitar duplicações.
   */
  static async recordInvoicePayment(params: {
    orgId: string
    clientId: string
    invoiceId: string
    amount: number
    method: string
    category?: string
    description?: string
    paidAt?: Date
  }) {
    const {
      orgId,
      clientId,
      invoiceId,
      amount,
      // method currently unused; kept in params for future extensions
      category = 'Mensalidade',
      description = `Pagamento fatura`,
      paidAt = new Date(),
    } = params

    // Idempotency check: evita criação duplicada se já existir
    // Verifica tanto pagamentos quanto lançamentos financeiros vinculados
    // Idempotency: check for an existing income transaction for this invoice
    const existingTransaction = await prisma.transaction.findFirst({
      where: { invoiceId, amount, type: 'INCOME' },
    })
    if (existingTransaction) {
      return prisma.invoice.findUnique({ where: { id: invoiceId } })
    }

    const [updatedInvoice] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' },
      }),
      prisma.transaction.create({
        data: {
          orgId,
          clientId,
          invoiceId,
          type: 'INCOME',
          subtype: 'INVOICE_PAYMENT',
          amount,
          description,
          category,
          date: paidAt,
        },
      }),
    ])

    // Auto-recovery de paymentStatus do cliente
    const remainingProblematic = await prisma.invoice.count({
      where: {
        clientId,
        orgId,
        status: { in: ['OPEN', 'OVERDUE'] },
      },
    })
    await prisma.client.update({
      where: { id: clientId },
      data: {
        paymentStatus: remainingProblematic > 0 ? 'PENDING' : 'CONFIRMED',
      },
    })

    return updatedInvoice
  }
}
