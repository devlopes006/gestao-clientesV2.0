import { Payment } from '@/core/domain/payment/entities/payment.entity'

export interface IPaymentRepository {
  save(payment: Payment): Promise<void>
  findById(id: string): Promise<Payment | null>
  findByOrgId(
    orgId: string,
    options?: { page?: number; limit?: number; invoiceId?: string }
  ): Promise<{ payments: Payment[]; total: number }>
}
