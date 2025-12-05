import type { InvoiceRepository } from '@/domain/invoices/InvoiceService'
import { PrismaClient } from '@prisma/client'

export class InvoicePrismaRepository implements InvoiceRepository {
  constructor(private prisma: PrismaClient) {}

  async existsForMonth(
    orgId: string,
    clientId: string,
    month: string
  ): Promise<boolean> {
    const [year, m] = month.split('-').map((x) => Number(x))
    const start = new Date(Date.UTC(year, m - 1, 1))
    const end = new Date(Date.UTC(year, m, 1))
    const existing = await this.prisma.invoice.findFirst({
      where: {
        orgId,
        clientId,
        dueDate: { gte: start, lt: end },
        deletedAt: null,
      },
      select: { id: true },
    })
    return !!existing
  }

  async createMonthly(
    orgId: string,
    clientId: string,
    month: string,
    amount: number
  ): Promise<{ id: string }> {
    const [year, m] = month.split('-').map((x) => Number(x))
    const dueDate = new Date(Date.UTC(year, m - 1, 1))
    const subtotal = amount
    const total = amount
    const invNumber = `${year}${String(m).padStart(2, '0')}-${clientId.slice(0, 6)}-${Date.now()}`
    const inv = await this.prisma.invoice.create({
      data: {
        orgId,
        clientId,
        number: invNumber,
        status: 'OPEN',
        dueDate,
        subtotal,
        total,
        items: {
          create: [
            {
              description: `Mensalidade ${month}`,
              unitAmount: amount,
              total: amount,
              quantity: 1,
            },
          ],
        },
      },
      select: { id: true },
    })
    return inv
  }

  async getById(id: string, orgId: string) {
    return this.prisma.invoice.findFirst({
      where: { id, orgId, deletedAt: null },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    })
  }

  async update(id: string, data: any) {
    return this.prisma.invoice.update({ where: { id }, data })
  }
}
