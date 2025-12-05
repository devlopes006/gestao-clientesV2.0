import { PrismaTransactionRepository } from '@/infrastructure/database/repositories/prisma-transaction.repository'
import { CreateTransactionUseCase } from '@/use-cases/transaction/create-transaction.use-case'
import { ListTransactionsUseCase } from '@/use-cases/transaction/list-transactions.use-case'
import { PrismaClient } from '@prisma/client'

/**
 * Transaction Controller
 * Coordena requisições HTTP para transações
 */
export class TransactionController {
  private repository: PrismaTransactionRepository
  private createUseCase: CreateTransactionUseCase
  private listUseCase: ListTransactionsUseCase

  constructor(prisma: PrismaClient) {
    this.repository = new PrismaTransactionRepository(prisma)
    this.createUseCase = new CreateTransactionUseCase(this.repository)
    this.listUseCase = new ListTransactionsUseCase(this.repository)
  }

  async create(input: {
    type: string
    subtype: string
    amount: number
    orgId: string
    date?: Date
    description?: string
    category?: string
    invoiceId?: string
    clientId?: string
    createdBy?: string
  }) {
    return this.createUseCase.execute(input as any)
  }

  async list(input: {
    orgId: string
    page?: number
    limit?: number
    startDate?: Date
    endDate?: Date
    status?: string[]
  }) {
    return this.listUseCase.execute(input as any)
  }
}
