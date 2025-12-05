import { z } from 'zod'

export const transactionInput = z.object({
  orgId: z.string().min(1),
  type: z.enum(['INCOME', 'EXPENSE']),
  subtype: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1),
  clientId: z.string().optional(),
})

export type TransactionInput = z.infer<typeof transactionInput>

export const transactionSummaryInput = z.object({
  orgId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type TransactionSummaryInput = z.infer<typeof transactionSummaryInput>

export type TransactionSummary = {
  income: number
  expense: number
  net: number
}

export interface TransactionRepository {
  create(data: TransactionInput): Promise<{ id: string }>
  listInRange(
    orgId: string,
    start: Date,
    end: Date
  ): Promise<ReadonlyArray<{ type: 'INCOME' | 'EXPENSE'; amount: number }>>
}

export class TransactionService {
  constructor(private repo: TransactionRepository) {}

  async create(input: TransactionInput): Promise<{ id: string }> {
    return this.repo.create(input)
  }

  async summary(input: TransactionSummaryInput): Promise<TransactionSummary> {
    const { orgId } = input
    const [sy, sm, sd] = input.startDate.split('-').map((x) => Number(x))
    const [ey, em, ed] = input.endDate.split('-').map((x) => Number(x))
    const start = new Date(Date.UTC(sy, sm - 1, sd))
    const end = new Date(Date.UTC(ey, em - 1, ed))
    const rows = await this.repo.listInRange(orgId, start, end)
    let income = 0
    let expense = 0
    for (const r of rows) {
      if (r.type === 'INCOME') income += r.amount
      else expense += r.amount
    }
    const net = income - expense
    return { income, expense, net }
  }
}
