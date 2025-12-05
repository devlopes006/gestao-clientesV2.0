import type { RecurringRepository } from '@/domain/recurring/RecurringExpenseService'
import { PrismaClient } from '@prisma/client'

export class RecurringPrismaRepository implements RecurringRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: any) {
    const rec = await this.prisma.recurringExpense.create({
      data: {
        name: input.name,
        description: input.description,
        amount: input.amount,
        category: input.category,
        cycle: input.cycle,
        dayOfMonth: input.dayOfMonth,
        active: input.active ?? true,
        orgId: input.orgId,
        createdBy: input.createdBy,
      },
      select: { id: true },
    })
    return rec
  }

  async update(id: string, orgId: string, input: any) {
    return this.prisma.recurringExpense.update({
      where: { id },
      data: { ...input },
    })
  }

  async getById(id: string, orgId: string) {
    return this.prisma.recurringExpense.findFirst({
      where: { id, orgId, deletedAt: null },
    })
  }

  async list(filters: {
    orgId: string
    active?: boolean
    cycle?: string
    includeDeleted?: boolean
  }) {
    const where: any = { orgId: filters.orgId }
    if (filters.active !== undefined) where.active = filters.active
    if (filters.cycle) where.cycle = filters.cycle
    if (!filters.includeDeleted) where.deletedAt = null
    return this.prisma.recurringExpense.findMany({
      where,
      orderBy: { name: 'asc' },
    })
  }
}
