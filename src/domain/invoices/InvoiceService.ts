import { z } from 'zod'

export const generateMonthlyInvoicesInput = z.object({
  orgId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  dryRun: z.boolean().optional().default(false),
})

export type GenerateMonthlyInvoicesInput = z.infer<
  typeof generateMonthlyInvoicesInput
>

export type GenerateMonthlyInvoicesResult = {
  created: number
  skipped: number
  details: Array<{
    clientId: string
    invoiceId?: string
    reason?: string
  }>
}

// Portas (interfaces) para repositórios — evitam acoplamento ao Prisma aqui
export interface ClientRepository {
  listActiveWithPlan(
    orgId: string
  ): Promise<Array<{ id: string; planAmount: number | null }>>
}

export interface InvoiceRepository {
  existsForMonth(
    orgId: string,
    clientId: string,
    month: string
  ): Promise<boolean>
  createMonthly(
    orgId: string,
    clientId: string,
    month: string,
    amount: number
  ): Promise<{ id: string }>
  getById(id: string, orgId: string): Promise<any | null>
  update(id: string, data: any): Promise<any>
}

export interface TransactionRepository {
  create(data: {
    orgId: string
    type: string
    subtype: string
    amount: number
    date: string | Date
    description?: string
    invoiceId?: string
    clientId?: string
    status?: string
    createdBy?: string
    metadata?: Record<string, any>
  }): Promise<{ id: string }>
}

export class InvoiceService {
  constructor(
    private clients: ClientRepository,
    private invoices: InvoiceRepository,
    private transactions?: TransactionRepository
  ) {}

  async generateMonthlyInvoices(
    input: GenerateMonthlyInvoicesInput
  ): Promise<GenerateMonthlyInvoicesResult> {
    const { orgId, month, dryRun } = input

    const clients = await this.clients.listActiveWithPlan(orgId)
    const details: GenerateMonthlyInvoicesResult['details'] = []
    let created = 0
    let skipped = 0

    for (const c of clients) {
      const hasExisting = await this.invoices.existsForMonth(orgId, c.id, month)
      if (hasExisting) {
        skipped++
        details.push({ clientId: c.id, reason: 'already-exists' })
        continue
      }

      if (!c.planAmount || c.planAmount <= 0) {
        skipped++
        details.push({ clientId: c.id, reason: 'no-plan' })
        continue
      }

      if (dryRun) {
        created++
        details.push({ clientId: c.id })
        continue
      }

      const inv = await this.invoices.createMonthly(
        orgId,
        c.id,
        month,
        c.planAmount
      )
      created++
      details.push({ clientId: c.id, invoiceId: inv.id })
    }

    return { created, skipped, details }
  }

  async approvePayment(
    invoiceId: string,
    orgId: string,
    input: { paidAt?: Date; notes?: string; createdBy?: string }
  ) {
    const invoice = await this.invoices.getById(invoiceId, orgId)
    if (!invoice) throw new Error('Fatura não encontrada')

    if (invoice.status === 'PAID') throw new Error('Fatura já está paga')
    if (invoice.status === 'CANCELLED')
      throw new Error('Fatura cancelada não pode ser paga')

    const paidAt = input.paidAt || invoice.dueDate

    const updated = await this.invoices.update(invoiceId, {
      status: 'PAID',
      paidAt,
      notes: input.notes || invoice.notes,
    })

    // create a transaction via transaction repository if provided
    if (this.transactions) {
      await this.transactions.create({
        orgId,
        type: 'INCOME',
        subtype: 'INVOICE_PAYMENT',
        amount: invoice.total,
        description: `Pagamento da fatura ${invoice.number} - ${invoice.client?.name ?? ''}`,
        date: paidAt,
        status: 'CONFIRMED',
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        createdBy: input.createdBy,
        metadata: {
          invoiceNumber: invoice.number,
          clientName: invoice.client?.name,
          daysLate: Math.max(
            0,
            Math.floor(
              (paidAt.getTime() - new Date(invoice.dueDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          ),
        },
      })
    }

    return updated
  }

  async cancel(
    invoiceId: string,
    orgId: string,
    reason?: string,
    cancelledBy?: string
  ) {
    const invoice = await this.invoices.getById(invoiceId, orgId)
    if (!invoice) throw new Error('Fatura não encontrada')

    if (invoice.status === 'PAID')
      throw new Error('Fatura paga não pode ser cancelada')
    if (invoice.status === 'CANCELLED')
      throw new Error('Fatura já está cancelada')

    const updated = await this.invoices.update(invoiceId, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      internalNotes: reason
        ? `${invoice.internalNotes || ''}\n\nCancelado: ${reason}`
        : invoice.internalNotes,
      updatedBy: cancelledBy,
    })

    return updated
  }
}
