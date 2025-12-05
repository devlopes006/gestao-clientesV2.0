import { prisma } from '@/lib/prisma'

type GenerateInstallmentsParams = {
  clientId: string
  isInstallment?: boolean
  installmentCount?: number
  contractValue?: number
  contractStart?: string | Date
  paymentDay?: number | null
  installmentValue?: number | null
  installmentPaymentDays?: number[] | null
}

export class ClientBillingService {
  static async generateInstallments(params: GenerateInstallmentsParams) {
    const {
      clientId,
      isInstallment,
      installmentCount,
      contractValue,
      contractStart,
      paymentDay,
      installmentValue,
      installmentPaymentDays,
    } = params

    if (
      !isInstallment ||
      !installmentCount ||
      !contractValue ||
      !contractStart
    ) {
      return
    }

    const startDate = new Date(contractStart)
    const amount = installmentValue ?? contractValue / installmentCount
    const daysToUse =
      installmentPaymentDays && installmentPaymentDays.length > 0
        ? installmentPaymentDays
        : [paymentDay ?? startDate.getDate()]

    const installmentsToCreate: Array<{
      clientId: string
      number: number
      amount: number
      dueDate: Date
      status: 'PENDING'
    }> = []

    let installmentNumber = 1
    const currentDate = new Date(startDate)

    while (installmentNumber <= installmentCount) {
      for (const day of daysToUse) {
        if (installmentNumber > installmentCount) break

        const dueDate = new Date(currentDate)
        // Ajusta ao último dia do mês quando necessário
        const lastDayOfMonth = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth() + 1,
          0
        ).getDate()
        dueDate.setDate(Math.min(day, lastDayOfMonth))

        installmentsToCreate.push({
          clientId,
          number: installmentNumber,
          amount,
          dueDate,
          status: 'PENDING',
        })

        installmentNumber++
      }

      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    if (installmentsToCreate.length > 0) {
      await prisma.installment.createMany({ data: installmentsToCreate })
    }
  }
}
