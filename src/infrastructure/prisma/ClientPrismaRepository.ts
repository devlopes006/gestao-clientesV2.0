import type { ClientRepository } from '@/domain/invoices/InvoiceService'
import { PrismaClient } from '@prisma/client'

export class ClientPrismaRepository implements ClientRepository {
  constructor(private prisma: PrismaClient) {}

  async listActiveWithPlan(
    orgId: string
  ): Promise<Array<{ id: string; planAmount: number | null }>> {
    const clients = await this.prisma.client.findMany({
      where: { orgId, status: 'ACTIVE' },
      select: {
        id: true,
        contractValue: true,
        isInstallment: true,
        installmentValue: true,
      },
    })

    return clients.map((c) => ({
      id: c.id,
      planAmount: c.isInstallment
        ? (c.installmentValue ?? null)
        : (c.contractValue ?? null),
    }))
  }
}
