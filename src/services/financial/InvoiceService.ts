import {
  InvoiceService as DomainInvoiceService,
  type TransactionRepository,
} from '@/domain/invoices/InvoiceService'
import { ClientPrismaRepository } from '@/infrastructure/prisma/ClientPrismaRepository'
import { InvoicePrismaRepository } from '@/infrastructure/prisma/InvoicePrismaRepository'
import { prisma } from '@/lib/prisma'
import {
  InvoiceStatus,
  type Invoice,
  type InvoiceItem,
  type Prisma,
} from '@prisma/client'

// Type definition for approve payment input
export interface ApprovPaymentInput {
  paidAt?: Date
  notes?: string
  createdBy?: string
}

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
    const domain = new DomainInvoiceService(
      new ClientPrismaRepository(prisma),
      new InvoicePrismaRepository(prisma)
    )

    // The domain method expects an input with month and dryRun flag.
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return domain.generateMonthlyInvoices({ orgId, month, dryRun: false })
  }

  /**
   * Aprova pagamento de uma fatura
   */
  static async approvePayment(
    invoiceId: string,
    orgId: string,
    input: ApprovePaymentInput
  ): Promise<Invoice> {
    const domain = new DomainInvoiceService(
      new ClientPrismaRepository(prisma),
      new InvoicePrismaRepository(prisma)
    )

    // pass a transaction repository so domain can create the financial transaction
    // lazily require to avoid circular imports at top-level
    const { TransactionPrismaRepository } = await import(
      '@/infrastructure/prisma/TransactionPrismaRepository'
    )
    const txRepo = new TransactionPrismaRepository(
      prisma
    ) as unknown as TransactionRepository
    // create a domain instance with transaction repository
    const domainWithTx = new DomainInvoiceService(
      new ClientPrismaRepository(prisma),
      new InvoicePrismaRepository(prisma),
      txRepo
    )

    const paymentData: ApprovPaymentInput = {
      paidAt: input.paidAt,
      notes: input.notes,
      createdBy: input.createdBy,
    }
    return domainWithTx.approvePayment(invoiceId, orgId, paymentData)
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
    const domain = new DomainInvoiceService(
      new ClientPrismaRepository(prisma),
      new InvoicePrismaRepository(prisma)
    )

    return domain.cancel(invoiceId, orgId, reason, cancelledBy)
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
