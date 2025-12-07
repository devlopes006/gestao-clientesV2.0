import { z } from 'zod'

import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'

export const VerifyPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  orgId: z.string().uuid(),
})

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>

export interface VerifyPaymentOutput {
  verified: boolean
  paymentId: string
}

export class VerifyPaymentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: VerifyPaymentInput): Promise<VerifyPaymentOutput> {
    const validated = VerifyPaymentInputSchema.parse(input)

    const payment = await this.repository.findById(validated.paymentId)
    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    if (payment.orgId !== validated.orgId) {
      throw new Error(
        'Unauthorized: payment does not belong to this organization'
      )
    }

    payment.verify()
    await this.repository.save(payment)

    return {
      verified: true,
      paymentId: payment.id,
    }
  }
}
