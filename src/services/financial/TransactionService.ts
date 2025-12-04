import { prisma } from '@/lib/prisma'
import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
  type Prisma,
  type Transaction,
} from '@prisma/client'

export interface CreateTransactionInput {
  type: TransactionType
  subtype: TransactionSubtype
  amount: number
  description?: string
  category?: string
  date?: Date
  status?: TransactionStatus
  invoiceId?: string
  clientId?: string
  costItemId?: string
  metadata?: Record<string, string | number | boolean | null>
  orgId: string
  createdBy?: string
}

export interface UpdateTransactionInput {
  type?: TransactionType
  subtype?: TransactionSubtype
  amount?: number
  description?: string
  category?: string
  date?: Date
  status?: TransactionStatus
  metadata?: Record<string, string | number | boolean | null>
  updatedBy?: string
}

export interface TransactionFilters {
  orgId: string
  type?: TransactionType
  subtype?: TransactionSubtype
  status?: TransactionStatus
  clientId?: string
  invoiceId?: string
  costItemId?: string
  category?: string
  dateFrom?: Date
  dateTo?: Date
  includeDeleted?: boolean
}

export interface PaginationOptions {
  page?: number
  limit?: number
  orderBy?: 'date' | 'amount' | 'createdAt'
  orderDirection?: 'asc' | 'desc'
}

export class TransactionService {
  /**
   * Cria uma nova transação financeira
   */
  static async create(input: CreateTransactionInput): Promise<Transaction> {
    // Validações
    if (input.amount <= 0) {
      throw new Error('O valor da transação deve ser maior que zero')
    }

    if (input.date && input.date > new Date()) {
      throw new Error('A data da transação não pode ser no futuro')
    }

    return prisma.transaction.create({
      data: {
        type: input.type,
        subtype: input.subtype,
        amount: input.amount,
        description: input.description,
        category: input.category,
        date: input.date || new Date(),
        status: input.status || TransactionStatus.CONFIRMED,
        invoiceId: input.invoiceId,
        clientId: input.clientId,
        costItemId: input.costItemId,
        metadata: input.metadata as Prisma.InputJsonValue,
        orgId: input.orgId,
        createdBy: input.createdBy,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
        costItem: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    })
  }

  /**
   * Busca transações com filtros e paginação
   */
  static async list(
    filters: TransactionFilters,
    pagination?: PaginationOptions
  ) {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 50
    const skip = (page - 1) * limit

    const where: Prisma.TransactionWhereInput = {
      orgId: filters.orgId,
      ...(filters.type && { type: filters.type }),
      ...(filters.subtype && { subtype: filters.subtype }),
      ...(filters.status && { status: filters.status }),
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.invoiceId && { invoiceId: filters.invoiceId }),
      ...(filters.costItemId && { costItemId: filters.costItemId }),
      ...(filters.category && { category: filters.category }),
      ...(filters.dateFrom || filters.dateTo
        ? {
            date: {
              ...(filters.dateFrom && { gte: filters.dateFrom }),
              ...(filters.dateTo && { lte: filters.dateTo }),
            },
          }
        : {}),
      ...(filters.includeDeleted ? {} : { deletedAt: null }),
    }

    const orderByField = pagination?.orderBy || 'date'
    const orderDirection = pagination?.orderDirection || 'desc'

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderDirection },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          costItem: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Busca uma transação por ID
   */
  static async getById(id: string, orgId: string): Promise<Transaction | null> {
    return prisma.transaction.findFirst({
      where: {
        id,
        orgId,
        deletedAt: null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
            total: true,
          },
        },
        costItem: {
          select: {
            id: true,
            name: true,
            category: true,
            amount: true,
          },
        },
      },
    })
  }

  /**
   * Atualiza uma transação
   */
  static async update(
    id: string,
    orgId: string,
    input: UpdateTransactionInput
  ): Promise<Transaction> {
    // Validações
    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error('O valor da transação deve ser maior que zero')
    }

    if (input.date && input.date > new Date()) {
      throw new Error('A data da transação não pode ser no futuro')
    }

    // Verifica se existe
    const existing = await this.getById(id, orgId)
    if (!existing) {
      throw new Error('Transação não encontrada')
    }

    return prisma.transaction.update({
      where: { id },
      data: {
        ...(input.type && { type: input.type }),
        ...(input.subtype && { subtype: input.subtype }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.date && { date: input.date }),
        ...(input.status && { status: input.status }),
        ...(input.metadata && {
          metadata: input.metadata as Prisma.InputJsonValue,
        }),
        updatedBy: input.updatedBy,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
        costItem: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    })
  }

  /**
   * Soft delete de uma transação
   */
  static async delete(
    id: string,
    orgId: string,
    deletedBy?: string
  ): Promise<Transaction> {
    const existing = await this.getById(id, orgId)
    if (!existing) {
      throw new Error('Transação não encontrada')
    }

    return prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    })
  }

  /**
   * Restaura uma transação deletada
   */
  static async restore(id: string, orgId: string): Promise<Transaction> {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        orgId,
        deletedAt: { not: null },
      },
    })

    if (!transaction) {
      throw new Error('Transação não encontrada ou não está deletada')
    }

    return prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    })
  }

  /**
   * Calcula resumo financeiro
   */
  static async getSummary(orgId: string, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.TransactionWhereInput = {
      orgId,
      deletedAt: null,
      status: TransactionStatus.CONFIRMED,
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const [incomes, expenses, byCategory, bySubtype, pendingInvoices] =
      await Promise.all([
        // Total de receitas
        prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.INCOME },
          _sum: { amount: true },
          _count: true,
        }),

        // Total de despesas
        prisma.transaction.aggregate({
          where: { ...where, type: TransactionType.EXPENSE },
          _sum: { amount: true },
          _count: true,
        }),

        // Agrupado por categoria
        prisma.transaction.groupBy({
          by: ['type', 'category'],
          where,
          _sum: { amount: true },
          _count: true,
          orderBy: {
            _sum: { amount: 'desc' },
          },
        }),

        // Agrupado por subtipo
        prisma.transaction.groupBy({
          by: ['type', 'subtype'],
          where,
          _sum: { amount: true },
          _count: true,
          orderBy: {
            _sum: { amount: 'desc' },
          },
        }),

        // Faturas pendentes (não pagas) do período
        prisma.invoice.aggregate({
          where: {
            orgId,
            status: { not: 'PAID' },
            deletedAt: null,
            ...(dateFrom || dateTo
              ? {
                  dueDate: {
                    ...(dateFrom && { gte: dateFrom }),
                    ...(dateTo && { lte: dateTo }),
                  },
                }
              : {}),
          },
          _sum: { total: true },
        }),
      ])

    const totalIncome = incomes._sum.amount || 0
    const totalExpense = expenses._sum.amount || 0
    const netProfit = totalIncome - totalExpense
    const pendingIncome = pendingInvoices._sum.total || 0

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
      pendingIncome,
      pendingExpense: 0,
      // Keep original structure for backward compatibility if needed
      income: {
        total: totalIncome,
        count: incomes._count,
      },
      expense: {
        total: totalExpense,
        count: expenses._count,
      },
      byCategory: byCategory.map((item) => ({
        type: item.type,
        category: item.category || 'Sem categoria',
        amount: item._sum.amount || 0,
        count: item._count,
      })),
      bySubtype: bySubtype.map((item) => ({
        type: item.type,
        subtype: item.subtype,
        amount: item._sum.amount || 0,
        count: item._count,
      })),
    }
  }
}
