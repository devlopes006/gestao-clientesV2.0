import { prisma } from '@/lib/prisma'
import { TransactionService } from '@/services/financial/TransactionService'
import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
  type ClientCostSubscription,
  type CostItem,
  type Prisma,
} from '@prisma/client'

export interface CreateCostItemInput {
  name: string
  description?: string
  amount: number
  category?: string
  active?: boolean
  orgId: string
  createdBy?: string
}

export interface UpdateCostItemInput {
  name?: string
  description?: string
  amount?: number
  category?: string
  active?: boolean
  updatedBy?: string
}

export interface CreateSubscriptionInput {
  clientId: string
  costItemId: string
  startDate: Date
  endDate?: Date
  active?: boolean
  notes?: string
  orgId: string
  createdBy?: string
}

export interface UpdateSubscriptionInput {
  startDate?: Date
  endDate?: Date
  active?: boolean
  notes?: string
  updatedBy?: string
}

export class CostTrackingService {
  // ==================== COST ITEMS ====================

  static async createCostItem(input: CreateCostItemInput): Promise<CostItem> {
    if (input.amount <= 0) {
      throw new Error('O valor do custo deve ser maior que zero')
    }

    return prisma.costItem.create({
      data: {
        name: input.name,
        description: input.description,
        amount: input.amount,
        category: input.category,
        active: input.active !== undefined ? input.active : true,
        orgId: input.orgId,
      },
    })
  }

  static async updateCostItem(
    id: string,
    orgId: string,
    input: UpdateCostItemInput
  ): Promise<CostItem> {
    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error('O valor do custo deve ser maior que zero')
    }

    const existing = await this.getCostItemById(id, orgId)
    if (!existing) {
      throw new Error('Item de custo não encontrado')
    }

    return prisma.costItem.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.active !== undefined && { active: input.active }),
      },
    })
  }

  static async deleteCostItem(
    id: string,
    orgId: string,
    deletedBy?: string
  ): Promise<CostItem> {
    const existing = await this.getCostItemById(id, orgId)
    if (!existing) {
      throw new Error('Item de custo não encontrado')
    }

    return prisma.costItem.update({
      where: { id },
      data: {
        active: false,
        ...(deletedBy ? { updatedBy: deletedBy } : {}),
      },
    })
  }

  static async getCostItemById(
    id: string,
    orgId: string
  ): Promise<CostItem | null> {
    return prisma.costItem.findFirst({
      where: {
        id,
        orgId,
        active: true,
      },
    })
  }

  static async listCostItems(filters: {
    orgId: string
    active?: boolean
    category?: string
  }) {
    const where: Prisma.CostItemWhereInput = {
      orgId: filters.orgId,
      ...(filters.active !== undefined && { active: filters.active }),
      ...(filters.category && { category: filters.category }),
    }

    return prisma.costItem.findMany({
      where,
      include: {
        subscriptions: {
          where: {
            active: true,
            deletedAt: null,
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
  }

  // ==================== SUBSCRIPTIONS ====================

  static async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<ClientCostSubscription> {
    if (input.endDate && input.endDate < input.startDate) {
      throw new Error('A data final não pode ser anterior à data inicial')
    }

    const existing = await prisma.clientCostSubscription.findFirst({
      where: {
        clientId: input.clientId,
        costItemId: input.costItemId,
        orgId: input.orgId,
        active: true,
        deletedAt: null,
        OR: [{ endDate: null }, { endDate: { gte: input.startDate } }],
      },
    })

    if (existing) {
      throw new Error(
        'Já existe uma associação ativa para este cliente e custo'
      )
    }

    return prisma.clientCostSubscription.create({
      data: {
        clientId: input.clientId,
        costItemId: input.costItemId,
        startDate: input.startDate,
        endDate: input.endDate,
        active: input.active !== undefined ? input.active : true,
        notes: input.notes,
        orgId: input.orgId,
        createdBy: input.createdBy,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        costItem: {
          select: {
            id: true,
            name: true,
            amount: true,
          },
        },
      },
    })
  }

  static async updateSubscription(
    id: string,
    orgId: string,
    input: UpdateSubscriptionInput
  ): Promise<ClientCostSubscription> {
    const existing = await this.getSubscriptionById(id, orgId)
    if (!existing) {
      throw new Error('Associação não encontrada')
    }

    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      throw new Error('A data final não pode ser anterior à data inicial')
    }

    return prisma.clientCostSubscription.update({
      where: { id },
      data: {
        ...(input.startDate && { startDate: input.startDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.notes !== undefined && { notes: input.notes }),
        updatedBy: input.updatedBy,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        costItem: {
          select: {
            id: true,
            name: true,
            amount: true,
          },
        },
      },
    })
  }

  static async deleteSubscription(
    id: string,
    orgId: string,
    deletedBy?: string
  ): Promise<ClientCostSubscription> {
    const existing = await this.getSubscriptionById(id, orgId)
    if (!existing) {
      throw new Error('Associação não encontrada')
    }

    return prisma.clientCostSubscription.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    })
  }

  static async getSubscriptionById(
    id: string,
    orgId: string
  ): Promise<ClientCostSubscription | null> {
    return prisma.clientCostSubscription.findFirst({
      where: {
        id,
        orgId,
        deletedAt: null,
      },
      include: {
        client: true,
        costItem: true,
      },
    })
  }

  static async listSubscriptions(filters: {
    orgId: string
    clientId?: string
    costItemId?: string
    active?: boolean
    includeDeleted?: boolean
  }) {
    const where: Prisma.ClientCostSubscriptionWhereInput = {
      orgId: filters.orgId,
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.costItemId && { costItemId: filters.costItemId }),
      ...(filters.active !== undefined && { active: filters.active }),
      ...(filters.includeDeleted ? {} : { deletedAt: null }),
    }

    return prisma.clientCostSubscription.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        costItem: {
          select: {
            id: true,
            name: true,
            amount: true,
            category: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })
  }

  // ==================== MATERIALIZAÇÃO ====================

  static async materializeMonthly(orgId: string, createdBy?: string) {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const subscriptions = await prisma.clientCostSubscription.findMany({
      where: {
        orgId,
        active: true,
        deletedAt: null,
        startDate: { lte: lastDayOfMonth },
        OR: [{ endDate: null }, { endDate: { gte: firstDayOfMonth } }],
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        costItem: {
          select: {
            id: true,
            name: true,
            amount: true,
            category: true,
          },
        },
      },
    })

    const results: any = { success: [], errors: [], skipped: [] }

    for (const subscription of subscriptions) {
      try {
        const existing = await prisma.transaction.findFirst({
          where: {
            orgId,
            clientId: subscription.clientId,
            costItemId: subscription.costItemId,
            subtype: TransactionSubtype.INTERNAL_COST,
            date: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
            deletedAt: null,
          },
        })

        if (existing) {
          results.skipped.push({
            subscriptionId: subscription.id,
            clientName: subscription.client.name,
            reason: 'Já materializado neste mês',
          })
          continue
        }

        const transaction = await TransactionService.create({
          type: TransactionType.EXPENSE,
          subtype: TransactionSubtype.INTERNAL_COST,
          amount: subscription.costItem.amount,
          description: `${subscription.costItem.name} - ${subscription.client.name}`,
          category: subscription.costItem.category ?? 'GERAL',
          date: now,
          status: TransactionStatus.CONFIRMED,
          clientId: subscription.clientId,
          costItemId: subscription.costItemId,
          orgId,
          createdBy,
          metadata: {
            subscriptionId: subscription.id,
            costItemName: subscription.costItem.name,
            clientName: subscription.client.name,
            monthYear: `${now.getMonth() + 1}/${now.getFullYear()}`,
          },
        })

        results.success.push({
          subscriptionId: subscription.id,
          clientId: subscription.clientId,
          clientName: subscription.client.name,
          costItemName: subscription.costItem.name,
          transactionId: transaction.id,
          amount: subscription.costItem.amount,
        })
      } catch (error) {
        results.errors.push({
          subscriptionId: subscription.id,
          clientName: subscription.client.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    return results
  }

  static async calculateClientMargin(
    clientId: string,
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const where: Prisma.TransactionWhereInput = {
      orgId,
      clientId,
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

    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ])

    const totalIncome = income._sum.amount || 0
    const totalExpense = expenses._sum.amount || 0
    const netProfit = totalIncome - totalExpense
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    return {
      clientId,
      income: totalIncome,
      expenses: totalExpense,
      netProfit,
      profitMargin,
    }
  }
}
