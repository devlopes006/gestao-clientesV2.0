import { RecurringExpenseService as DomainRecurringService } from '@/domain/recurring/RecurringExpenseService'
import { RecurringPrismaRepository } from '@/infrastructure/prisma/RecurringPrismaRepository'
import { TransactionPrismaRepository } from '@/infrastructure/prisma/TransactionPrismaRepository'
import { prisma } from '@/lib/prisma'
import { ExpenseCycle, type RecurringExpense } from '@prisma/client'

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
  static async create(
    input: CreateRecurringExpenseInput
  ): Promise<RecurringExpense> {
    const domain = new DomainRecurringService(
      new RecurringPrismaRepository(prisma),
      new TransactionPrismaRepository(prisma)
    )
    const created = await domain.create({
      ...input,
      createdBy: input.createdBy,
    })
    return created as RecurringExpense
  }

  static async update(
    id: string,
    orgId: string,
    input: UpdateRecurringExpenseInput
  ): Promise<RecurringExpense> {
    const domain = new DomainRecurringService(
      new RecurringPrismaRepository(prisma),
      new TransactionPrismaRepository(prisma)
    )
    return (await domain.update(id, orgId, {
      ...input,
      updatedBy: input.updatedBy,
    })) as RecurringExpense
  }

  static async delete(
    id: string,
    orgId: string,
    deletedBy?: string
  ): Promise<RecurringExpense> {
    const domain = new DomainRecurringService(
      new RecurringPrismaRepository(prisma),
      new TransactionPrismaRepository(prisma)
    )
    // mark inactive
    return (await domain.update(id, orgId, {
      active: false,
      updatedBy: deletedBy,
    })) as RecurringExpense
  }

  static async getById(
    id: string,
    orgId: string
  ): Promise<RecurringExpense | null> {
    const domain = new DomainRecurringService(
      new RecurringPrismaRepository(prisma),
      new TransactionPrismaRepository(prisma)
    )
    return (await domain.getById(id, orgId)) as RecurringExpense | null
  }

  static async list(filters: {
    orgId: string
    active?: boolean
    cycle?: ExpenseCycle
    includeDeleted?: boolean
  }) {
    const domain = new DomainRecurringService(
      new RecurringPrismaRepository(prisma),
      new TransactionPrismaRepository(prisma)
    )
    return domain.list({
      orgId: filters.orgId,
      active: filters.active,
      cycle: filters.cycle ? String(filters.cycle) : undefined,
      includeDeleted: filters.includeDeleted,
    })
  }

  static async materializeMonthly(orgId: string, createdBy?: string) {
    const domain = new DomainRecurringService(
      new RecurringPrismaRepository(prisma),
      new TransactionPrismaRepository(prisma)
    )
    return domain.materializeMonthly(orgId, createdBy)
  }

  static async materializeAnnually(orgId: string, createdBy?: string) {
    const domain = new DomainRecurringService(
      new RecurringPrismaRepository(prisma),
      new TransactionPrismaRepository(prisma)
    )
    return domain.materializeAnnually(orgId, createdBy)
  }

  static async materializeSingle(
    orgId: string,
    expenseId: string,
    createdBy?: string
  ) {
    const domain = new DomainRecurringService(
      new RecurringPrismaRepository(prisma),
      new TransactionPrismaRepository(prisma)
    )
    return domain.materializeSingle(orgId, expenseId, createdBy)
  }
}
