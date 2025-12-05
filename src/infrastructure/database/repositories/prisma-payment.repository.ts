import {
  Payment,
  PaymentStatus,
} from '@/core/domain/payment/entities/payment.entity'
import { Money } from '@/core/domain/payment/value-objects/money.vo'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'
import { prisma } from '@/lib/prisma'
import {
  Transaction,
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '@prisma/client'

export class PrismaPaymentRepository implements IPaymentRepository {
  async save(payment: Payment): Promise<void> {
    const data = this.mapToTransaction(payment)

    await prisma.transaction.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    })
  }

  async findByOrgId(
    orgId: string,
    options?: { page?: number; limit?: number; invoiceId?: string }
  ): Promise<{ payments: Payment[]; total: number }> {
    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const where: any = {
      orgId,
      category: 'payment',
      deletedAt: null,
    }

    if (options?.invoiceId) {
      where.invoiceId = options.invoiceId
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      payments: data.map((d) => this.mapToDomain(d)),
      total,
    }
  }

  async findById(id: string): Promise<Payment | null> {
    const record = await prisma.transaction.findUnique({ where: { id } })
    if (!record) return null
    return this.mapToDomain(record)
  }

  private mapToTransaction(payment: Payment) {
    const props = payment.toPrimitives()

    return {
      id: props.id,
      orgId: props.orgId,
      clientId: props.clientId,
      amount: props.amount,
      description: props.description,
      date: props.dueDate,
      status: this.mapStatus(props.status),
      type: TransactionType.INCOME,
      subtype: TransactionSubtype.INVOICE_PAYMENT,
      invoiceId: undefined,
      costItemId: undefined,
      metadata: undefined,
      createdAt: props.createdAt,
      createdBy: undefined,
      updatedAt: props.updatedAt,
      updatedBy: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
      category: 'payment',
    }
  }

  private mapStatus(status: PaymentStatus): TransactionStatus {
    switch (status) {
      case PaymentStatus.CONFIRMED:
        return TransactionStatus.CONFIRMED
      case PaymentStatus.LATE:
        return TransactionStatus.CANCELLED
      default:
        return TransactionStatus.PENDING
    }
  }

  private mapToDomain(transaction: Transaction): Payment {
    return new Payment({
      id: transaction.id,
      orgId: transaction.orgId,
      clientId: transaction.clientId ?? '',
      amount: new Money(transaction.amount),
      dueDate: transaction.date,
      status: this.mapToPaymentStatus(transaction.status),
      description: transaction.description,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      paidAt: null,
    })
  }

  private mapToPaymentStatus(status: TransactionStatus): PaymentStatus {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return PaymentStatus.CONFIRMED
      case TransactionStatus.CANCELLED:
        return PaymentStatus.LATE
      default:
        return PaymentStatus.PENDING
    }
  }
}
