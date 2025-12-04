import { prisma } from '@/lib/prisma'
import {
  ExpenseCycle,
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
  type Prisma,
  type RecurringExpense,
} from '@prisma/client'
import { TransactionService } from './TransactionService'

export interface CreateRecurringExpenseInput {
  name: string
  description?: string
  amount: number
  category?: string
  cycle: ExpenseCycle
  dayOfMonth?: number
  active?: boolean
  orgId: string
  createdBy?: string
}

export interface UpdateRecurringExpenseInput {
  name?: string
  description?: string
  amount?: number
  category?: string
  cycle?: ExpenseCycle
  dayOfMonth?: number
  active?: boolean
  updatedBy?: string
}

export class RecurringExpenseService {
  /**
   * Cria uma nova despesa fixa recorrente
   */
  static async create(
    input: CreateRecurringExpenseInput
  ): Promise<RecurringExpense> {
    // Validações
    if (input.amount <= 0) {
      throw new Error('O valor da despesa deve ser maior que zero')
    }

    if (input.dayOfMonth && (input.dayOfMonth < 1 || input.dayOfMonth > 31)) {
      throw new Error('O dia do mês deve estar entre 1 e 31')
    }

    return prisma.recurringExpense.create({
      data: {
        name: input.name,
        description: input.description,
        amount: input.amount,
        category: input.category,
        cycle: input.cycle,
        dayOfMonth: input.dayOfMonth,
        active: input.active !== undefined ? input.active : true,
        orgId: input.orgId,
        createdBy: input.createdBy,
      },
    })
  }

  /**
   * Atualiza uma despesa fixa
   */
  static async update(
    id: string,
    orgId: string,
    input: UpdateRecurringExpenseInput
  ): Promise<RecurringExpense> {
    // Validações
    if (input.amount !== undefined && input.amount <= 0) {
      throw new Error('O valor da despesa deve ser maior que zero')
    }

    if (input.dayOfMonth && (input.dayOfMonth < 1 || input.dayOfMonth > 31)) {
      throw new Error('O dia do mês deve estar entre 1 e 31')
    }

    const existing = await this.getById(id, orgId)
    if (!existing) {
      throw new Error('Despesa fixa não encontrada')
    }

    return prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.cycle && { cycle: input.cycle }),
        ...(input.dayOfMonth !== undefined && { dayOfMonth: input.dayOfMonth }),
        ...(input.active !== undefined && { active: input.active }),
        updatedBy: input.updatedBy,
      },
    })
  }

  /**
   * Soft delete
   */
  static async delete(
    id: string,
    orgId: string,
    deletedBy?: string
  ): Promise<RecurringExpense> {
    const existing = await this.getById(id, orgId)
    if (!existing) {
      throw new Error('Despesa fixa não encontrada')
    }

    return prisma.recurringExpense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    })
  }

  /**
   * Busca por ID
   */
  static async getById(
    id: string,
    orgId: string
  ): Promise<RecurringExpense | null> {
    return prisma.recurringExpense.findFirst({
      where: {
        id,
        orgId,
        deletedAt: null,
      },
    })
  }

  /**
   * Lista despesas fixas
   */
  static async list(filters: {
    orgId: string
    active?: boolean
    cycle?: ExpenseCycle
    includeDeleted?: boolean
  }) {
    const where: Prisma.RecurringExpenseWhereInput = {
      orgId: filters.orgId,
      ...(filters.active !== undefined && { active: filters.active }),
      ...(filters.cycle && { cycle: filters.cycle }),
      ...(filters.includeDeleted ? {} : { deletedAt: null }),
    }

    return prisma.recurringExpense.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })
  }

  /**
   * Materializa despesas fixas do mês
   */
  static async materializeMonthly(orgId: string, createdBy?: string) {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Busca despesas ativas do tipo mensal
    const expenses = await prisma.recurringExpense.findMany({
      where: {
        orgId,
        active: true,
        cycle: ExpenseCycle.MONTHLY,
        deletedAt: null,
      },
    })

    const results = {
      success: [] as {
        expenseId: string
        name: string
        transactionId: string
        amount: number
      }[],
      errors: [] as { expenseId: string; name: string; error: string }[],
      skipped: [] as { expenseId: string; name: string; reason: string }[],
    }

    for (const expense of expenses) {
      try {
        // Verifica se já materializou neste mês
        const existing = await prisma.transaction.findFirst({
          where: {
            orgId,
            subtype: TransactionSubtype.FIXED_EXPENSE,
            category: expense.category || undefined,
            description: {
              contains: expense.name,
            },
            date: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
            deletedAt: null,
          },
        })

        if (existing) {
          results.skipped.push({
            expenseId: expense.id,
            name: expense.name,
            reason: 'Já materializado neste mês',
          })
          continue
        }

        // Calcula data da transação
        const dayOfMonth = expense.dayOfMonth || 1
        let transactionDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          dayOfMonth
        )
        if (transactionDate > lastDayOfMonth) {
          transactionDate.setDate(lastDayOfMonth.getDate())
        }
        // Não permitir data futura
        const today = new Date()
        if (transactionDate > today) {
          transactionDate = today
        }

        // Cria transaction
        const transaction = await TransactionService.create({
          type: TransactionType.EXPENSE,
          subtype: TransactionSubtype.FIXED_EXPENSE,
          amount: expense.amount,
          description: `${expense.name}${expense.description ? ` - ${expense.description}` : ''}`,
          category: expense.category ?? undefined,
          date: transactionDate,
          status: TransactionStatus.CONFIRMED,
          orgId,
          createdBy,
          metadata: {
            recurringExpenseId: expense.id,
            cycle: expense.cycle,
            monthYear: `${now.getMonth() + 1}/${now.getFullYear()}`,
          },
        })

        results.success.push({
          expenseId: expense.id,
          name: expense.name,
          transactionId: transaction.id,
          amount: expense.amount,
        })
      } catch (error) {
        results.errors.push({
          expenseId: expense.id,
          name: expense.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    return results
  }

  /**
   * Materializa despesas fixas anuais
   */
  static async materializeAnnually(orgId: string, createdBy?: string) {
    const now = new Date()
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
    const lastDayOfYear = new Date(now.getFullYear(), 11, 31)

    // Busca despesas ativas do tipo anual
    const expenses = await prisma.recurringExpense.findMany({
      where: {
        orgId,
        active: true,
        cycle: ExpenseCycle.ANNUAL,
        deletedAt: null,
      },
    })

    const results = {
      success: [] as {
        expenseId: string
        name: string
        transactionId: string
        amount: number
      }[],
      errors: [] as { expenseId: string; name: string; error: string }[],
      skipped: [] as { expenseId: string; name: string; reason: string }[],
    }

    for (const expense of expenses) {
      try {
        // Verifica se já materializou neste ano
        const existing = await prisma.transaction.findFirst({
          where: {
            orgId,
            subtype: TransactionSubtype.FIXED_EXPENSE,
            category: expense.category || undefined,
            description: {
              contains: expense.name,
            },
            date: {
              gte: firstDayOfYear,
              lte: lastDayOfYear,
            },
            deletedAt: null,
          },
        })

        if (existing) {
          results.skipped.push({
            expenseId: expense.id,
            name: expense.name,
            reason: 'Já materializado neste ano',
          })
          continue
        }

        // Cria transaction
        const transaction = await TransactionService.create({
          type: TransactionType.EXPENSE,
          subtype: TransactionSubtype.FIXED_EXPENSE,
          amount: expense.amount,
          description: `${expense.name}${expense.description ? ` - ${expense.description}` : ''}`,
          category: expense.category ?? undefined,
          date: now,
          status: TransactionStatus.CONFIRMED,
          orgId,
          createdBy,
          metadata: {
            recurringExpenseId: expense.id,
            cycle: expense.cycle,
            year: now.getFullYear(),
          },
        })

        results.success.push({
          expenseId: expense.id,
          name: expense.name,
          transactionId: transaction.id,
          amount: expense.amount,
        })
      } catch (error) {
        results.errors.push({
          expenseId: expense.id,
          name: expense.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }

    return results
  }

  /**
   * Materializa uma despesa fixa específica para o mês atual
   */
  static async materializeSingle(
    orgId: string,
    expenseId: string,
    createdBy?: string
  ) {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const expense = await prisma.recurringExpense.findFirst({
      where: { id: expenseId, orgId, active: true, deletedAt: null },
    })
    if (!expense) {
      throw new Error('Despesa fixa não encontrada ou inativa')
    }

    // Verifica se já materializada neste mês
    const existing = await prisma.transaction.findFirst({
      where: {
        orgId,
        subtype: TransactionSubtype.FIXED_EXPENSE,
        description: { contains: expense.name },
        date: { gte: firstDayOfMonth, lte: lastDayOfMonth },
        deletedAt: null,
      },
    })
    if (existing) {
      return { status: 'skipped', reason: 'Já materializado neste mês' }
    }

    const dayOfMonth = expense.dayOfMonth || 1
    let txDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
    if (txDate > lastDayOfMonth) txDate.setDate(lastDayOfMonth.getDate())
    // Não permitir data futura
    const today = new Date()
    if (txDate > today) txDate = today

    const transaction = await TransactionService.create({
      type: TransactionType.EXPENSE,
      subtype: TransactionSubtype.FIXED_EXPENSE,
      amount: expense.amount,
      description: `${expense.name}${expense.description ? ` - ${expense.description}` : ''}`,
      category: expense.category ?? undefined,
      date: txDate,
      status: TransactionStatus.CONFIRMED,
      orgId,
      createdBy,
      metadata: {
        recurringExpenseId: expense.id,
        cycle: expense.cycle,
        monthYear: `${now.getMonth() + 1}/${now.getFullYear()}`,
      },
    })

    return { status: 'created', transactionId: transaction.id }
  }
}
