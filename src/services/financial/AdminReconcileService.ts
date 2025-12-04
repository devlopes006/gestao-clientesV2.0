import { prisma } from '@/lib/prisma'

export class AdminReconcileService {
  /**
   * Reconcile month totals by moving nearby transactions into the month until targets met.
   * Only moves dates (no amount edits). Returns a report of changes.
   */
  static async reconcileMonth(
    orgId: string,
    year: number,
    month: number,
    targetIncome: number | null,
    targetExpense: number | null
  ) {
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

    // current sums in period
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: 'CONFIRMED',
          type: 'INCOME',
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: 'CONFIRMED',
          type: 'EXPENSE',
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ])

    const currentIncome = incomeAgg._sum.amount || 0
    const currentExpense = expenseAgg._sum.amount || 0

    const report: {
      changes: Array<{
        id: string
        action: 'moved_date'
        type: 'INCOME' | 'EXPENSE'
        amount: number
        from: Date
        to: Date
      }>
      before: { currentIncome: number; currentExpense: number }
      after?: { currentIncome: number; currentExpense: number }
    } = {
      changes: [],
      before: {
        currentIncome,
        currentExpense,
      },
    }

    // helper to move transactions into month
    async function fillTarget(
      type: 'INCOME' | 'EXPENSE',
      current: number,
      target: number
    ) {
      let remaining = target - current
      if (remaining <= 0) return { moved: 0 }

      // Candidates: transactions within +-31 days outside the month
      const windowStart = new Date(start)
      windowStart.setDate(windowStart.getDate() - 31)
      const windowEnd = new Date(end)
      windowEnd.setDate(windowEnd.getDate() + 31)

      const candidates = await prisma.transaction.findMany({
        where: {
          orgId,
          deletedAt: null,
          status: 'CONFIRMED',
          type,
          AND: [
            {
              OR: [
                { date: { lt: start, gte: windowStart } },
                { date: { gt: end, lte: windowEnd } },
              ],
            },
          ],
        },
        orderBy: [{ date: 'asc' }, { amount: 'desc' }],
      })

      let movedCount = 0
      for (const tx of candidates) {
        if (remaining <= 0) break
        // skip if amount is larger than remaining by > 10%? We'll accept partial overshoot
        const oldDate = tx.date
        const newDate = new Date(start)
        // set to start of month (keeps it in period)
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { date: newDate },
        })
        report.changes.push({
          id: tx.id,
          action: 'moved_date',
          type,
          amount: tx.amount,
          from: oldDate,
          to: newDate,
        })
        remaining -= tx.amount
        movedCount++
      }
      return { moved: movedCount }
    }

    // Fill income
    if (typeof targetIncome === 'number') {
      await fillTarget('INCOME', currentIncome, targetIncome)
    }

    // Fill expense
    if (typeof targetExpense === 'number') {
      await fillTarget('EXPENSE', currentExpense, targetExpense)
    }

    // recompute after
    const [incomeAfter, expenseAfter] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: 'CONFIRMED',
          type: 'INCOME',
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: 'CONFIRMED',
          type: 'EXPENSE',
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ])

    report.after = {
      currentIncome: incomeAfter._sum.amount || 0,
      currentExpense: expenseAfter._sum.amount || 0,
    }

    return report
  }
}

export default AdminReconcileService
