import { Transaction } from '@/domain/transaction/entities/transaction.entity'
import { TransactionStatus } from '@/domain/transaction/value-objects/transaction-type.vo'

/**
 * Interface do Repository de Transactions
 */

export interface ITransactionRepository {
  /**
   * Salva uma transação
   */
  save(transaction: Transaction): Promise<void>

  /**
   * Busca uma transação por ID
   */
  findById(id: string): Promise<Transaction | null>

  /**
   * Lista transações de uma organização
   */
  findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      startDate?: Date
      endDate?: Date
      status?: TransactionStatus[]
      type?: string[]
    }
  ): Promise<{ transactions: Transaction[]; total: number }>

  /**
   * Lista transações de um cliente
   */
  findByClientId(
    clientId: string,
    options?: {
      page?: number
      limit?: number
    }
  ): Promise<{ transactions: Transaction[]; total: number }>

  /**
   * Deleta uma transação
   */
  delete(id: string): Promise<void>

  /**
   * Verifica se existe
   */
  exists(id: string): Promise<boolean>
}
