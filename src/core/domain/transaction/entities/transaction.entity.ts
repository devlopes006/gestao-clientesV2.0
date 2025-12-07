import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '../value-objects/transaction-type.vo'

/**
 * Transaction Entity
 * Representa uma transação financeira (receita ou despesa)
 *
 * Regras de Negócio:
 * - Transação confirmada não pode ser alterada
 * - Apenas transações pendentes podem ser canceladas
 * - Valor deve ser sempre positivo (tipo define se é entrada ou saída)
 * - Metadados podem armazenar informações adicionais
 */

export interface TransactionProps {
  id: string
  type: TransactionType
  subtype: TransactionSubtype
  amount: Money
  description?: string | null
  category?: string | null
  date: Date
  status: TransactionStatus
  invoiceId?: string | null
  clientId?: string | null
  costItemId?: string | null
  metadata?: Record<string, unknown> | null
  orgId: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdBy?: string | null
  updatedBy?: string | null
  deletedBy?: string | null
}

export class Transaction {
  private constructor(private props: TransactionProps) {
    this.validateInvariant()
  }

  // ============ Getters ============

  get id(): string {
    return this.props.id
  }

  get type(): TransactionType {
    return this.props.type
  }

  get subtype(): TransactionSubtype {
    return this.props.subtype
  }

  get amount(): Money {
    return this.props.amount
  }

  get description(): string | null {
    return this.props.description ?? null
  }

  get category(): string | null {
    return this.props.category ?? null
  }

  get date(): Date {
    return this.props.date
  }

  get status(): TransactionStatus {
    return this.props.status
  }

  get invoiceId(): string | null {
    return this.props.invoiceId ?? null
  }

  get clientId(): string | null {
    return this.props.clientId ?? null
  }

  get costItemId(): string | null {
    return this.props.costItemId ?? null
  }

  get orgId(): string {
    return this.props.orgId
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata ?? null
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null
  }

  get createdBy(): string | null {
    return this.props.createdBy ?? null
  }

  get updatedBy(): string | null {
    return this.props.updatedBy ?? null
  }

  get deletedBy(): string | null {
    return this.props.deletedBy ?? null
  }

  // ============ Factory Methods ============

  /**
   * Cria uma nova transação
   */
  static create(props: {
    type: TransactionType
    subtype: TransactionSubtype
    amount: Money
    date: Date
    orgId: string
    description?: string
    category?: string
    invoiceId?: string
    clientId?: string
    costItemId?: string
    metadata?: Record<string, unknown>
    createdBy?: string
  }): Transaction {
    return new Transaction({
      id: '', // Será gerado pelo repositório
      type: props.type,
      subtype: props.subtype,
      amount: props.amount,
      description: props.description,
      category: props.category,
      date: props.date,
      status: TransactionStatus.PENDING,
      invoiceId: props.invoiceId,
      clientId: props.clientId,
      costItemId: props.costItemId,
      metadata: props.metadata,
      orgId: props.orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: props.createdBy,
      updatedBy: null,
      deletedBy: null,
    })
  }

  /**
   * Restaura uma transação existente do banco
   */
  static restore(props: TransactionProps): Transaction {
    return new Transaction(props)
  }

  // ============ Business Logic ============

  /**
   * Confirma a transação
   */
  confirm(): void {
    if (this.props.status === TransactionStatus.CONFIRMED) {
      throw new Error('Transação já está confirmada')
    }

    if (this.props.status === TransactionStatus.CANCELLED) {
      throw new Error('Transação cancelada não pode ser confirmada')
    }

    this.props.status = TransactionStatus.CONFIRMED
    this.props.updatedAt = new Date()
  }

  /**
   * Cancela a transação
   */
  cancel(): void {
    if (this.props.status === TransactionStatus.CONFIRMED) {
      throw new Error('Transação confirmada não pode ser cancelada')
    }

    if (this.props.status === TransactionStatus.CANCELLED) {
      throw new Error('Transação já está cancelada')
    }

    this.props.status = TransactionStatus.CANCELLED
    this.props.updatedAt = new Date()
  }

  /**
   * Atualiza a descrição
   */
  updateDescription(description?: string): void {
    if (this.props.status === TransactionStatus.CONFIRMED) {
      throw new Error('Transação confirmada não pode ser alterada')
    }

    this.props.description = description
    this.props.updatedAt = new Date()
  }

  /**
   * Soft delete
   */
  softDelete(): void {
    this.props.deletedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Verifica se pode ser editada
   */
  canBeEdited(): boolean {
    return (
      this.props.status !== TransactionStatus.CONFIRMED && !this.props.deletedAt
    )
  }

  /**
   * Verifica se pode ser confirmada
   */
  canBeConfirmed(): boolean {
    return (
      this.props.status === TransactionStatus.PENDING && !this.props.deletedAt
    )
  }

  /**
   * Verifica se pode ser cancelada
   */
  canBeCancelled(): boolean {
    return (
      this.props.status !== TransactionStatus.CONFIRMED && !this.props.deletedAt
    )
  }

  /**
   * Calcula o saldo de transações
   */
  static calculateBalance(transactions: Transaction[]): Money {
    const nonDeletedTransactions = transactions.filter((t) => !t.deletedAt)

    if (nonDeletedTransactions.length === 0) {
      return new Money(0, 'BRL')
    }

    let balance = new Money(0, nonDeletedTransactions[0].amount.currency)

    for (const transaction of nonDeletedTransactions) {
      if (transaction.type === TransactionType.INCOME) {
        balance = balance.add(transaction.amount)
      } else {
        balance = balance.subtract(transaction.amount)
      }
    }

    return balance
  }

  // ============ Validações ============

  /**
   * Valida invariantes da entidade
   */
  private validateInvariant(): void {
    // Valor deve ser positivo
    if (this.props.amount.isZero() || this.props.amount.toNumber() <= 0) {
      throw new Error('Valor da transação deve ser maior que zero')
    }
  }
}
