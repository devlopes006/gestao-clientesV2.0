import { Money } from '@/core/domain/payment/value-objects/money.vo'

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSED = 'PROCESSED',
  VERIFIED = 'VERIFIED',
  LATE = 'LATE',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
  CASH = 'CASH',
}

export interface PaymentProps {
  id: string
  orgId: string
  invoiceId?: string
  clientId?: string
  amount: Money
  dueDate?: Date
  status: PaymentStatus
  description?: string | null
  createdAt: Date
  updatedAt: Date
  paidAt?: Date | null
  processedAt?: Date | null
  verifiedAt?: Date | null
  refundedAt?: Date | null
  failureReason?: string | null
  method?: PaymentMethod
  reference?: string | null
  notes?: string | null
  refundedAmount?: Money | null
}

export class Payment {
  constructor(private props: PaymentProps) {}

  static create(params: {
    id: string
    orgId: string
    invoiceId?: string
    clientId?: string
    amount: number | Money
    dueDate?: Date
    description?: string | null
    method?: PaymentMethod
    reference?: string | null
    notes?: string | null
    status?: PaymentStatus
    createdAt?: Date
    updatedAt?: Date
    paidAt?: Date | null
  }): Payment {
    const now = new Date()
    const amount =
      params.amount instanceof Money ? params.amount : new Money(params.amount)

    return new Payment({
      id: params.id,
      orgId: params.orgId,
      invoiceId: params.invoiceId,
      clientId: params.clientId,
      amount,
      dueDate: params.dueDate,
      description: params.description ?? null,
      method: params.method,
      reference: params.reference ?? null,
      notes: params.notes,
      status: params.status ?? PaymentStatus.PENDING,
      createdAt: params.createdAt ?? now,
      updatedAt: params.updatedAt ?? now,
      paidAt: params.paidAt ?? null,
    })
  }

  get id() {
    return this.props.id
  }

  get orgId() {
    return this.props.orgId
  }

  get clientId() {
    return this.props.clientId
  }

  get amount() {
    return this.props.amount
  }

  get status() {
    return this.props.status
  }

  get dueDate() {
    return this.props.dueDate
  }

  get paidAt() {
    return this.props.paidAt ?? null
  }

  get description() {
    return this.props.description ?? null
  }

  get method() {
    return this.props.method
  }

  get reference() {
    return this.props.reference ?? null
  }

  get notes() {
    return this.props.notes ?? null
  }

  get invoiceId() {
    return this.props.invoiceId
  }

  get processedAt() {
    return this.props.processedAt ?? null
  }

  get verifiedAt() {
    return this.props.verifiedAt ?? null
  }

  get refundedAt() {
    return this.props.refundedAt ?? null
  }

  get failureReason() {
    return this.props.failureReason ?? null
  }

  get refundedAmount() {
    return this.props.refundedAmount ?? null
  }

  get isVerified(): boolean {
    return this.props.status === PaymentStatus.VERIFIED
  }

  get isFailed(): boolean {
    return this.props.status === PaymentStatus.FAILED
  }

  get isRefunded(): boolean {
    return this.props.status === PaymentStatus.REFUNDED
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  process(reference?: string) {
    if (this.props.status !== PaymentStatus.PENDING) {
      throw new Error('Somente pagamentos pendentes podem ser processados')
    }
    this.props.status = PaymentStatus.PROCESSED
    this.props.processedAt = new Date()
    this.props.reference = reference ?? this.props.reference
    this.props.updatedAt = new Date()
  }

  verify() {
    if (this.props.status === PaymentStatus.VERIFIED) {
      throw new Error('Pagamento já foi verificado')
    }
    if (this.props.status !== PaymentStatus.PROCESSED) {
      throw new Error('Pagamento deve estar processado para verificação')
    }
    this.props.status = PaymentStatus.VERIFIED
    this.props.verifiedAt = new Date()
    this.props.updatedAt = new Date()
  }

  fail(reason: string) {
    if (this.props.status === PaymentStatus.VERIFIED) {
      throw new Error('Pagamento verificado não pode ser marcado como falho')
    }
    this.props.status = PaymentStatus.FAILED
    this.props.failureReason = reason
    this.props.updatedAt = new Date()
  }

  refund(amount?: Money) {
    if (this.props.status === PaymentStatus.REFUNDED) {
      throw new Error('Pagamento já foi reembolsado')
    }
    if (!this.canBeRefunded()) {
      throw new Error('Apenas pagamentos verificados podem ser reembolsados')
    }
    if (amount && amount.isGreaterThan(this.props.amount)) {
      throw new Error(
        'Valor do reembolso não pode exceder o valor do pagamento'
      )
    }
    this.props.status = PaymentStatus.REFUNDED
    this.props.refundedAt = new Date()
    this.props.refundedAmount = amount ?? this.props.amount
    this.props.updatedAt = new Date()
  }

  addNote(note: string) {
    if (!note || note.trim().length === 0) {
      throw new Error('Nota não pode ser vazia')
    }
    const existingNotes = this.props.notes ?? ''
    this.props.notes = existingNotes ? `${existingNotes}\n${note}` : note
    this.props.updatedAt = new Date()
  }

  canBeRefunded(): boolean {
    const refundableStatuses = [PaymentStatus.VERIFIED]
    return refundableStatuses.includes(this.props.status)
  }

  toJSON() {
    return {
      id: this.props.id,
      orgId: this.props.orgId,
      invoiceId: this.props.invoiceId,
      clientId: this.props.clientId,
      amount: this.props.amount,
      dueDate: this.props.dueDate,
      description: this.props.description,
      method: this.props.method,
      reference: this.props.reference,
      notes: this.props.notes,
      status: this.props.status,
      processedAt: this.props.processedAt,
      verifiedAt: this.props.verifiedAt,
      refundedAt: this.props.refundedAt,
      failureReason: this.props.failureReason,
      refundedAmount: this.props.refundedAmount,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      paidAt: this.props.paidAt,
    }
  }

  toPrimitives() {
    return {
      id: this.props.id,
      orgId: this.props.orgId,
      clientId: this.props.clientId,
      amount: this.props.amount.amount,
      status: this.props.status,
      dueDate: this.props.dueDate,
      description: this.props.description ?? null,
      reference: this.props.reference ?? null,
      method: this.props.method,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      paidAt: this.paidAt,
    }
  }
}
