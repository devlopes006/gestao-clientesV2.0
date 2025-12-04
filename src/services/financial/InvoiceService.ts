import { prisma } from '@/lib/prisma'
import {
  InvoiceStatus,
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
  type Invoice,
  type InvoiceItem,
  type Prisma,
} from '@prisma/client'
import { TransactionService } from './TransactionService'

export interface CreateInvoiceInput {
  clientId: string
  orgId: string
  dueDate: Date
  items: {
    description: string
    quantity?: number
    unitAmount: number
  }[]
  discount?: number
  tax?: number
  notes?: string
  internalNotes?: string
  installmentId?: string
  createdBy?: string
}

export interface UpdateInvoiceInput {
  dueDate?: Date
  discount?: number
  tax?: number
  notes?: string
  internalNotes?: string
  status?: InvoiceStatus
  updatedBy?: string
}

export interface ApprovePaymentInput {
  paidAt?: Date
  notes?: string
  createdBy?: string
}

export class InvoiceService {
  /**
   * Gera o próximo número de fatura
   */
  private static async generateInvoiceNumber(orgId: string): Promise<string> {
    const year = new Date().getFullYear()
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        orgId,
        number: {
          startsWith: `${year}-`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    let sequence = 1
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.number.split('-')[1])
      sequence = lastSequence + 1
    }

    return `${year}-${sequence.toString().padStart(4, '0')}`
  }

  /**
   * Calcula totais da fatura
   */
  private static calculateTotals(
    items: { quantity?: number; unitAmount: number }[],
    discount: number = 0,
    tax: number = 0
  ) {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.quantity || 1) * item.unitAmount,
      0
    )
    const total = subtotal - discount + tax

    return { subtotal, total }
  }

  /**
   * Cria uma nova fatura
   */
  static async create(
    input: CreateInvoiceInput
  ): Promise<Invoice & { items: InvoiceItem[] }> {
    // Validações
    if (input.items.length === 0) {
      throw new Error('A fatura deve ter pelo menos um item')
    }

    const { subtotal, total } = this.calculateTotals(
      input.items,
      input.discount,
      input.tax
    )

    const number = await this.generateInvoiceNumber(input.orgId)

    return prisma.invoice.create({
      data: {
        number,
        clientId: input.clientId,
        orgId: input.orgId,
        dueDate: input.dueDate,
        subtotal,
        discount: input.discount || 0,
        tax: input.tax || 0,
        total,
        notes: input.notes,
        internalNotes: input.internalNotes,
        installmentId: input.installmentId,
        createdBy: input.createdBy,
        items: {
          create: input.items.map((item) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitAmount: item.unitAmount,
            total: (item.quantity || 1) * item.unitAmount,
          })),
        },
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        installment: true,
      },
    })
  }

  /**
   * Gera faturas mensais para clientes ativos
   */
  static async generateMonthlyInvoices(orgId: string, createdBy?: string) {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Busca clientes ativos com contratos vigentes
    const clients = await prisma.client.findMany({
      where: {
        orgId,
        status: 'active',
        contractValue: { gt: 0 },
        contractStart: { lte: now },
        OR: [{ contractEnd: null }, { contractEnd: { gte: firstDayOfMonth } }],
      },
    })

    const results = {
      success: [] as Invoice[],
      errors: [] as { clientId: string; clientName: string; error: string }[],
      blocked: [] as { clientId: string; clientName: string; reason: string }[],
    }

    for (const client of clients) {
      try {
        // Verifica se cliente tem faturas em aberto
        const openInvoices = await prisma.invoice.count({
          where: {
            clientId: client.id,
            orgId,
            status: {
              in: [InvoiceStatus.OPEN, InvoiceStatus.OVERDUE],
            },
            deletedAt: null,
          },
        })

        if (openInvoices > 0) {
          results.blocked.push({
            clientId: client.id,
            clientName: client.name,
            reason: `Cliente possui ${openInvoices} fatura(s) em aberto`,
          })
          continue
        }

        // Verifica se já gerou fatura neste mês
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            clientId: client.id,
            orgId,
            issueDate: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
            deletedAt: null,
          },
        })

        if (existingInvoice) {
          results.blocked.push({
            clientId: client.id,
            clientName: client.name,
            reason: 'Fatura já gerada neste mês',
          })
          continue
        }

        // Calcula data de vencimento
        const paymentDay = client.paymentDay || 10
        const dueDate = new Date(now.getFullYear(), now.getMonth(), paymentDay)
        if (dueDate < now) {
          dueDate.setMonth(dueDate.getMonth() + 1)
        }

        // Gera fatura
        const invoice = await this.create({
          clientId: client.id,
          orgId,
          dueDate,
          items: [
            {
              description: `Serviços de ${client.plan || 'gestão'} - ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
              quantity: 1,
              unitAmount: client.contractValue!,
            },
          ],
          createdBy,
        })

        results.success.push(invoice)
      } catch (error) {
        results.errors.push({
          clientId: client.id,
          clientName: client.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    return results
  }

  /**
   * Aprova pagamento de uma fatura
   */
  static async approvePayment(
    invoiceId: string,
    orgId: string,
    input: ApprovePaymentInput
  ): Promise<Invoice> {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        orgId,
        deletedAt: null,
      },
      include: {
        client: true,
      },
    })

    if (!invoice) {
      throw new Error('Fatura não encontrada')
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Fatura já está paga')
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Fatura cancelada não pode ser paga')
    }

    // Usa data de vencimento como data de pagamento padrão, não hoje
    const paidAt = input.paidAt || invoice.dueDate

    // Atualiza status da fatura
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt,
        notes: input.notes || invoice.notes,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    })

    // Cria lançamento financeiro (Transaction)
    await TransactionService.create({
      type: TransactionType.INCOME,
      subtype: TransactionSubtype.INVOICE_PAYMENT,
      amount: invoice.total,
      description: `Pagamento da fatura ${invoice.number} - ${invoice.client.name}`,
      category: 'RECEITA_CLIENTE',
      date: paidAt,
      status: TransactionStatus.CONFIRMED,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      orgId,
      createdBy: input.createdBy,
      metadata: {
        invoiceNumber: invoice.number,
        clientName: invoice.client.name,
        daysLate: Math.max(
          0,
          Math.floor(
            (paidAt.getTime() - invoice.dueDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
      },
    })

    return updatedInvoice
  }

  /**
   * Cancela uma fatura
   */
  static async cancel(
    invoiceId: string,
    orgId: string,
    reason?: string,
    cancelledBy?: string
  ): Promise<Invoice> {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        orgId,
        deletedAt: null,
      },
    })

    if (!invoice) {
      throw new Error('Fatura não encontrada')
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Fatura paga não pode ser cancelada')
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('Fatura já está cancelada')
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.CANCELLED,
        cancelledAt: new Date(),
        internalNotes: reason
          ? `${invoice.internalNotes || ''}\n\nCancelado: ${reason}`
          : invoice.internalNotes,
        updatedBy: cancelledBy,
      },
    })
  }

  /**
   * Atualiza status de faturas vencidas
   */
  static async updateOverdueInvoices(orgId: string): Promise<number> {
    const result = await prisma.invoice.updateMany({
      where: {
        orgId,
        status: InvoiceStatus.OPEN,
        dueDate: { lt: new Date() },
        deletedAt: null,
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    })

    return result.count
  }

  /**
   * Lista faturas com filtros e paginação
   */
  static async list(
    filters: {
      orgId: string
      clientId?: string
      status?: InvoiceStatus
      dateFrom?: Date
      dateTo?: Date
      includeDeleted?: boolean
    },
    pagination?: {
      page?: number
      limit?: number
    }
  ) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const skip = (page - 1) * limit

    const where: Prisma.InvoiceWhereInput = {
      orgId: filters.orgId,
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.dateFrom || filters.dateTo
        ? {
            dueDate: {
              ...(filters.dateFrom && { gte: filters.dateFrom }),
              ...(filters.dateTo && { lte: filters.dateTo }),
            },
          }
        : {}),
      ...(filters.includeDeleted ? {} : { deletedAt: null }),
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
          installment: true,
        },
        orderBy: {
          dueDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Busca fatura por ID
   */
  static async getById(id: string, orgId: string) {
    return prisma.invoice.findFirst({
      where: {
        id,
        orgId,
        deletedAt: null,
      },
      include: {
        client: true,
        items: true,
        installment: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  }
}
