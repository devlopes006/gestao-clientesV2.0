import { z } from 'zod'

import { IPaymentRepository } from '@/core/ports/repositories/payment.repository.interface'

export const ProcessPaymentInputSchema = z.object({
  paymentId: z.string().uuid(),
  orgId: z.string().uuid(),
  reference: z.string().min(1).optional(),
})

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentInputSchema>

export interface ProcessPaymentOutput {
  processed: boolean
  paymentId: string
}

export class ProcessPaymentUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  async execute(input: ProcessPaymentInput): Promise<ProcessPaymentOutput> {
    const validated = ProcessPaymentInputSchema.parse(input)

    const payment = await this.repository.findById(validated.paymentId)
    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    if (payment.orgId !== validated.orgId) {
      throw new Error(
        'Unauthorized: payment does not belong to this organization'
      )
    }

    payment.process(validated.reference)
    await this.repository.save(payment)

    return {
      processed: true,
      paymentId: payment.id,
    }
  }
}
