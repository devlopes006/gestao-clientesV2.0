import { Transaction } from '@/domain/transaction/entities/transaction.entity'
import { TransactionStatus } from '@/domain/transaction/value-objects/transaction-type.vo'
import { ITransactionRepository } from '@/ports/repositories/transaction.repository.interface'
import { z } from 'zod'

export const ListTransactionsInputSchema = z.object({
  orgId: z.string().uuid(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(200).optional().default(50),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.array(z.nativeEnum(TransactionStatus)).optional(),
})

export type ListTransactionsInput = z.infer<typeof ListTransactionsInputSchema>

export interface ListTransactionsOutput {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Use Case: Listar Transações
 */
export class ListTransactionsUseCase {
  constructor(private readonly repository: ITransactionRepository) {}

  async execute(input: ListTransactionsInput): Promise<ListTransactionsOutput> {
    const validated = ListTransactionsInputSchema.parse(input)

    const { transactions, total } = await this.repository.findByOrgId(
      validated.orgId,
      {
        page: validated.page,
        limit: validated.limit,
        startDate: validated.startDate,
        endDate: validated.endDate,
        status: validated.status,
      }
    )

    const totalPages = Math.ceil(total / validated.limit)

    return {
      transactions,
      total,
      page: validated.page,
      limit: validated.limit,
      totalPages,
    }
  }
}
