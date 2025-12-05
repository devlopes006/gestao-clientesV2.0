import type { TransactionRepository } from '@/domain/transactions/TransactionService'
import { z } from 'zod'

export const createRecurringExpenseInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  category: z.string().optional(),
  cycle: z.string().min(1),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  active: z.boolean().optional(),
  orgId: z.string().min(1),
})

export type CreateRecurringExpenseInput = z.infer<
  typeof createRecurringExpenseInput
>

export type MaterializeResult = {
  success: Array<{
    expenseId: string
    name: string
    transactionId: string
    amount: number
  }>
  errors: Array<{ expenseId: string; name: string; error: string }>
  skipped: Array<{ expenseId: string; name: string; reason: string }>
}

export interface RecurringRepository {
  create(
    input: CreateRecurringExpenseInput & { createdBy?: string }
  ): Promise<{ id: string }>
  update(
    id: string,
    orgId: string,
    input: Partial<CreateRecurringExpenseInput> & { updatedBy?: string }
  ): Promise<any>
  getById(id: string, orgId: string): Promise<any | null>
  list(filters: {
    orgId: string
    active?: boolean
    cycle?: string
    includeDeleted?: boolean
  }): Promise<any[]>
}

export class RecurringExpenseService {
  constructor(
    private recurringRepo: RecurringRepository,
    private transactionRepo: TransactionRepository
  ) {}

  async create(input: CreateRecurringExpenseInput & { createdBy?: string }) {
    const parsed = createRecurringExpenseInput.safeParse(input)
    if (!parsed.success) throw new Error('Invalid input')
    return this.recurringRepo.create(input)
  }

  async update(
    id: string,
    orgId: string,
    input: Partial<CreateRecurringExpenseInput> & { updatedBy?: string }
  ) {
    return this.recurringRepo.update(id, orgId, input)
  }

  async getById(id: string, orgId: string) {
    return this.recurringRepo.getById(id, orgId)
  }

  async list(filters: {
    orgId: string
    active?: boolean
    cycle?: string
    includeDeleted?: boolean
  }) {
    return this.recurringRepo.list(filters)
  }

  async materializeMonthly(
    orgId: string,
    createdBy?: string
  ): Promise<MaterializeResult> {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const expenses = await this.recurringRepo.list({
      orgId,
      active: true,
      cycle: 'MONTHLY',
    })

    const results: MaterializeResult = { success: [], errors: [], skipped: [] }

    for (const expense of expenses) {
      try {
        // check existing transaction via transactionRepo listing by range is not implemented here
        // We rely on transactionRepo.create to still be idempotent / caller ensures uniqueness if needed
        const dayOfMonth = expense.dayOfMonth || 1
        let transactionDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          dayOfMonth
        )
        if (transactionDate > lastDayOfMonth)
          transactionDate.setDate(lastDayOfMonth.getDate())
        const today = new Date()
        if (transactionDate > today) transactionDate = today

        const tx = await this.transactionRepo.create({
          orgId,
          type: 'EXPENSE',
          subtype: 'FIXED_EXPENSE' as any,
          amount: expense.amount,
          date: transactionDate.toISOString().slice(0, 10),
          description: `${expense.name}${expense.description ? ` - ${expense.description}` : ''}`,
          clientId: expense.clientId ?? undefined,
        } as any)

        results.success.push({
          expenseId: expense.id,
          name: expense.name,
          transactionId: tx.id,
          amount: expense.amount,
        })
      } catch (err: any) {
        results.errors.push({
          expenseId: expense.id,
          name: expense.name,
          error: err?.message ?? 'unknown',
        })
      }
    }

    return results
  }

  async materializeAnnually(orgId: string, createdBy?: string) {
    // similar to monthly, but for yearly cycle
    const now = new Date()
    const expenses = await this.recurringRepo.list({
      orgId,
      active: true,
      cycle: 'ANNUAL',
    })
    const results: MaterializeResult = { success: [], errors: [], skipped: [] }
    for (const expense of expenses) {
      try {
        const tx = await this.transactionRepo.create({
          orgId,
          type: 'EXPENSE',
          subtype: 'FIXED_EXPENSE' as any,
          amount: expense.amount,
          date: now.toISOString().slice(0, 10),
          description: `${expense.name}${expense.description ? ` - ${expense.description}` : ''}`,
          clientId: expense.clientId ?? undefined,
        } as any)
        results.success.push({
          expenseId: expense.id,
          name: expense.name,
          transactionId: tx.id,
          amount: expense.amount,
        })
      } catch (err: any) {
        results.errors.push({
          expenseId: expense.id,
          name: expense.name,
          error: err?.message ?? 'unknown',
        })
      }
    }
    return results
  }

  async materializeSingle(
    orgId: string,
    expenseId: string,
    createdBy?: string
  ) {
    const expense = await this.recurringRepo.getById(expenseId, orgId)
    if (!expense) throw new Error('Despesa fixa não encontrada')
    const now = new Date()
    const tx = await this.transactionRepo.create({
      orgId,
      type: 'EXPENSE',
      subtype: 'FIXED_EXPENSE' as any,
      amount: expense.amount,
      date: now.toISOString().slice(0, 10),
      description: `${expense.name}${expense.description ? ` - ${expense.description}` : ''}`,
      clientId: expense.clientId ?? undefined,
    } as any)
    return { status: 'ok', transactionId: tx.id }
  }
}
