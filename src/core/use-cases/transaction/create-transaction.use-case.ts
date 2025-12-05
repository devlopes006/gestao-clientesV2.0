import { Money } from '@/domain/invoice/value-objects/money.vo'
import { Transaction } from '@/domain/transaction/entities/transaction.entity'
import {
  TransactionSubtype,
  TransactionType,
} from '@/domain/transaction/value-objects/transaction-type.vo'
import { ITransactionRepository } from '@/ports/repositories/transaction.repository.interface'
import { z } from 'zod'

export const CreateTransactionInputSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  subtype: z.enum([
    'INVOICE_PAYMENT',
    'OTHER_INCOME',
    'INTERNAL_COST',
    'FIXED_EXPENSE',
    'OTHER_EXPENSE',
  ]),
  amount: z.number().positive(),
  orgId: z.string().uuid(),
  date: z.date().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  invoiceId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
})

export type CreateTransactionInput = z.infer<
  typeof CreateTransactionInputSchema
>

export interface CreateTransactionOutput {
  transactionId: string
}

/**
 * Use Case: Criar Transação
 */
export class CreateTransactionUseCase {
  constructor(private readonly repository: ITransactionRepository) {}

  async execute(
    input: CreateTransactionInput
  ): Promise<CreateTransactionOutput> {
    const validated = CreateTransactionInputSchema.parse(input)

    const transaction = Transaction.create({
      type: validated.type as TransactionType,
      subtype: validated.subtype as TransactionSubtype,
      amount: new Money(validated.amount),
      orgId: validated.orgId,
      date: validated.date ?? new Date(),
      description: validated.description,
      category: validated.category,
      invoiceId: validated.invoiceId,
      clientId: validated.clientId,
      createdBy: validated.createdBy,
    })

    await this.repository.save(transaction)

    return { transactionId: transaction.id }
  }
}
