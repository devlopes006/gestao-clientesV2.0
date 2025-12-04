import { prisma } from '@/lib/prisma'

export class AdminFinancialService {
  /**
   * Normaliza transações de um mês:
   * - Move transações na borda para dentro do mês (±7 dias)
   * - Corrige transações no futuro para o fim do mês selecionado
   */
  static async normalizeMonth(orgId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const lastDay = new Date(year, month, 0)
    const end = new Date(
      lastDay.getFullYear(),
      lastDay.getMonth(),
      lastDay.getDate(),
      23,
      59,
      59,
      999
    )

    const beforeWindowStart = new Date(start)
    beforeWindowStart.setDate(beforeWindowStart.getDate() - 7)
    const afterWindowEnd = new Date(end)
    afterWindowEnd.setDate(afterWindowEnd.getDate() + 7)

    // 1) Transações dentro da janela anterior (até 7 dias antes) movidas para o início do mês
    const movedToStart = await prisma.transaction.updateMany({
      where: {
        orgId,
        deletedAt: null,
        date: { gte: beforeWindowStart, lt: start },
      },
      data: { date: start },
    })

    // 2) Transações dentro da janela posterior (até 7 dias após) movidas para o fim do mês
    const movedToEnd = await prisma.transaction.updateMany({
      where: {
        orgId,
        deletedAt: null,
        date: { gt: end, lte: afterWindowEnd },
      },
      data: { date: end },
    })

    // 3) Transações muito no futuro (além da janela) do org: clamp para hoje
    const today = new Date()
    const movedFuturesToToday = await prisma.transaction.updateMany({
      where: {
        orgId,
        deletedAt: null,
        date: { gt: today },
      },
      data: { date: today },
    })

    return {
      month,
      year,
      movedToStart: movedToStart.count,
      movedToEnd: movedToEnd.count,
      movedFuturesToToday: movedFuturesToToday.count,
    }
  }
}
