import { z } from 'zod'

import { Money } from '@/core/domain/payment/value-objects/money.vo'
import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'

export const RefundPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  orgId: z.string().uuid(),
  amount: z.number().positive().optional(),
})

export type RefundPaymentInput = z.infer<typeof RefundPaymentInputSchema>

export interface RefundPaymentOutput {
  refunded: boolean
  paymentId: string
  refundedAmount: number
}

export class RefundPaymentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const validated = RefundPaymentInputSchema.parse(input)

    const payment = await this.repository.findById(validated.paymentId)
    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    if (payment.orgId !== validated.orgId) {
      throw new Error(
        'Unauthorized: payment does not belong to this organization'
      )
    }

    const refundAmount = validated.amount
      ? new Money(validated.amount)
      : undefined

    payment.refund(refundAmount)
    await this.repository.save(payment)

    return {
      refunded: true,
      paymentId: payment.id,
      refundedAmount: refundAmount?.amount ?? payment.amount.amount,
    }
  }
}
