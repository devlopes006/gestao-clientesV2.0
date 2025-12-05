import { CostTrackingService } from '@/domain/costs/CostTrackingService'
import { prisma } from '@/lib/prisma'
import { TransactionService } from '@/services/financial/TransactionService'
import {
  ExpenseCycle,
  InvoiceStatus,
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
  type Prisma,
} from '@prisma/client'

export class ReportingService {
  static async getDashboard(orgId: string, dateFrom?: Date, dateTo?: Date) {
    const [
      transactionSummary,
      invoiceSummary,
      overdueInvoices,
      topClientsByRevenue,
      topClientsByOverdue,
      recentTransactions,
    ] = await Promise.all([
      TransactionService.getSummary(orgId, dateFrom, dateTo),
      this.getInvoiceSummary(orgId, dateFrom, dateTo),
      this.getOverdueInvoices(orgId),
      this.getTopClientsByRevenue(orgId, dateFrom, dateTo),
      this.getTopClientsByOverdue(orgId),
      this.getRecentTransactions(orgId, 10),
    ])

    const [
      fixedMonthlyAgg,
      fixedMaterializedAgg,
      nonFixedExpenseAgg,
      cashIncomeAgg,
      cashExpenseAgg,
    ] = await Promise.all([
      prisma.recurringExpense.aggregate({
        where: {
          orgId,
          active: true,
          cycle: ExpenseCycle.MONTHLY,
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: TransactionStatus.CONFIRMED,
          subtype: TransactionSubtype.FIXED_EXPENSE,
          ...(dateFrom || dateTo
            ? {
                date: {
                  ...(dateFrom && { gte: dateFrom }),
                  ...(dateTo && { lte: dateTo }),
                },
              }
            : {}),
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.EXPENSE,
          NOT: { subtype: TransactionSubtype.FIXED_EXPENSE },
          ...(dateFrom || dateTo
            ? {
                date: {
                  ...(dateFrom && { gte: dateFrom }),
                  ...(dateTo && { lte: dateTo }),
                },
              }
            : {}),
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.INCOME,
          date: { lte: new Date() },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          orgId,
          deletedAt: null,
          status: TransactionStatus.CONFIRMED,
          type: TransactionType.EXPENSE,
          date: { lte: new Date() },
        },
        _sum: { amount: true },
      }),
    ])

    const monthlyFixedTotal = fixedMonthlyAgg._sum.amount || 0
    const materializedFixedThisPeriod = fixedMaterializedAgg._sum.amount || 0
    const pendingFixed = Math.max(
      0,
      monthlyFixedTotal - materializedFixedThisPeriod
    )
    const openInvoicesThisPeriod =
      (invoiceSummary.open?.total || 0) + (invoiceSummary.overdue?.total || 0)
    const nonFixedExpenseThisPeriod = nonFixedExpenseAgg._sum.amount || 0
    const projectedNetProfit =
      openInvoicesThisPeriod - (nonFixedExpenseThisPeriod + pendingFixed)
    const cashOnHand =
      (cashIncomeAgg._sum.amount || 0) - (cashExpenseAgg._sum.amount || 0)

    return {
      financial: { ...transactionSummary, pendingExpense: pendingFixed },
      invoices: invoiceSummary,
      overdue: overdueInvoices,
      topClients: {
        byRevenue: topClientsByRevenue,
        byOverdue: topClientsByOverdue,
      },
      recentActivity: recentTransactions,
      projections: {
        monthlyFixedTotal,
        materializedFixedThisPeriod,
        pendingFixed,
        openInvoicesThisPeriod,
        nonFixedExpenseThisPeriod,
        cashOnHand,
        incomeToDate: cashIncomeAgg._sum.amount || 0,
        expenseToDate: cashExpenseAgg._sum.amount || 0,
        cashOnHandMonthly: (() => {
          const incomePeriod = transactionSummary.totalIncome || 0
          const expensePeriod = transactionSummary.totalExpense || 0
          return incomePeriod - expensePeriod
        })(),
        projectedNetProfit,
      },
    }
  }

  static async auditFinancial(orgId: string, year: number, months: number[]) {
    const results: Array<any> = []

    for (const month of months) {
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

      const [summary, invoiceSummary] = await Promise.all([
        TransactionService.getSummary(orgId, start, end),
        this.getInvoiceSummary(orgId, start, end),
      ])

      const [
        fixedMonthlyAgg,
        fixedMaterializedAgg,
        nonFixedExpenseAgg,
        cashIncomeAgg,
        cashExpenseAgg,
      ] = await Promise.all([
        prisma.recurringExpense.aggregate({
          where: {
            orgId,
            active: true,
            cycle: ExpenseCycle.MONTHLY,
            deletedAt: null,
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            orgId,
            deletedAt: null,
            status: TransactionStatus.CONFIRMED,
            subtype: TransactionSubtype.FIXED_EXPENSE,
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            orgId,
            deletedAt: null,
            status: TransactionStatus.CONFIRMED,
            type: TransactionType.EXPENSE,
            NOT: { subtype: TransactionSubtype.FIXED_EXPENSE },
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            orgId,
            deletedAt: null,
            status: TransactionStatus.CONFIRMED,
            type: TransactionType.INCOME,
            date: { lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            orgId,
            deletedAt: null,
            status: TransactionStatus.CONFIRMED,
            type: TransactionType.EXPENSE,
            date: { lte: end },
          },
          _sum: { amount: true },
        }),
      ])

      const fixedMonthlyTotal = fixedMonthlyAgg._sum.amount || 0
      const fixedMaterialized = fixedMaterializedAgg._sum.amount || 0
      const pendingFixed = Math.max(0, fixedMonthlyTotal - fixedMaterialized)
      const openInvoicesTotal =
        (invoiceSummary.open?.total || 0) + (invoiceSummary.overdue?.total || 0)
      const nonFixedExpenseThisPeriod = nonFixedExpenseAgg._sum.amount || 0
      const projectedNetProfit =
        openInvoicesTotal - (nonFixedExpenseThisPeriod + pendingFixed)

      const periodIncome = summary.totalIncome || 0
      const periodExpense = summary.totalExpense || 0
      const periodNet = periodIncome - periodExpense
      const cashIncome = cashIncomeAgg._sum.amount || 0
      const cashExpense = cashExpenseAgg._sum.amount || 0
      const cashOnHand = cashIncome - cashExpense

      const anomalies: string[] = []
      const futureTxCount = await prisma.transaction.count({
        where: { orgId, deletedAt: null, date: { gt: end } },
      })
      if (futureTxCount > 0)
        anomalies.push(`Transações no futuro: ${futureTxCount}`)

      if (fixedMaterialized > fixedMonthlyTotal + 0.01)
        anomalies.push(
          `Fixas materializadas (${fixedMaterialized.toFixed(2)}) > fixas mensais (${fixedMonthlyTotal.toFixed(2)})`
        )

      const negativeTxCount = await prisma.transaction.count({
        where: {
          orgId,
          deletedAt: null,
          amount: { lt: 0 },
          date: { gte: start, lte: end },
        },
      })
      if (negativeTxCount > 0)
        anomalies.push(`Transações negativas no mês: ${negativeTxCount}`)

      results.push({
        month,
        cashIncome,
        cashExpense,
        cashOnHand,
        periodIncome,
        periodExpense,
        periodNet,
        fixedMonthlyTotal,
        fixedMaterialized,
        pendingFixed,
        openInvoicesTotal,
        nonFixedExpenseThisPeriod,
        projectedNetProfit,
        anomalies,
      })
    }

    return { year, months, results }
  }

  static async getInvoiceSummary(
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const openWhere: Prisma.InvoiceWhereInput = {
      orgId,
      status: InvoiceStatus.OPEN,
      deletedAt: null,
      ...(dateFrom || dateTo
        ? {
            dueDate: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const overdueWhere: Prisma.InvoiceWhereInput = {
      orgId,
      status: InvoiceStatus.OVERDUE,
      deletedAt: null,
      ...(dateFrom || dateTo
        ? {
            dueDate: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const paidWhere: Prisma.InvoiceWhereInput = {
      orgId,
      status: InvoiceStatus.PAID,
      deletedAt: null,
      ...(dateFrom || dateTo
        ? {
            paidAt: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const cancelledWhere: Prisma.InvoiceWhereInput = {
      orgId,
      status: InvoiceStatus.CANCELLED,
      deletedAt: null,
      ...(dateFrom || dateTo
        ? {
            cancelledAt: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const [open, paid, overdue, cancelled] = await Promise.all([
      prisma.invoice.aggregate({
        where: openWhere,
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: paidWhere,
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: overdueWhere,
        _sum: { total: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: cancelledWhere,
        _sum: { total: true },
        _count: true,
      }),
    ])

    return {
      open: { count: open._count, total: open._sum.total || 0 },
      paid: { count: paid._count, total: paid._sum.total || 0 },
      overdue: { count: overdue._count, total: overdue._sum.total || 0 },
      cancelled: { count: cancelled._count, total: cancelled._sum.total || 0 },
      totalReceivable: (open._sum.total || 0) + (overdue._sum.total || 0),
    }
  }

  static async getOverdueInvoices(orgId: string, limit: number = 10) {
    const invoices = await prisma.invoice.findMany({
      where: { orgId, status: InvoiceStatus.OVERDUE, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    })

    const now = new Date()
    return invoices.map((invoice) => ({
      ...invoice,
      daysLate: Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))
  }

  static async getTopClientsByRevenue(
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 10
  ) {
    const where: Prisma.TransactionWhereInput = {
      orgId,
      type: TransactionType.INCOME,
      status: TransactionStatus.CONFIRMED,
      deletedAt: null,
      clientId: { not: null },
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom && { gte: dateFrom }),
              ...(dateTo && { lte: dateTo }),
            },
          }
        : {}),
    }

    const transactions = await prisma.transaction.groupBy({
      by: ['clientId'],
      where,
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    })
    const clientIds = transactions
      .map((t) => t.clientId)
      .filter((id): id is string => id !== null)
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true },
    })
    const clientMap = new Map(clients.map((c) => [c.id, c]))

    return transactions.map((t) => ({
      clientId: t.clientId!,
      clientName: clientMap.get(t.clientId!)?.name || 'Cliente não encontrado',
      clientEmail: clientMap.get(t.clientId!)?.email,
      totalRevenue: t._sum.amount || 0,
      transactionCount: t._count,
    }))
  }

  static async getTopClientsByOverdue(orgId: string, limit: number = 10) {
    const invoices = await prisma.invoice.groupBy({
      by: ['clientId'],
      where: { orgId, status: InvoiceStatus.OVERDUE, deletedAt: null },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    })
    const clientIds = invoices.map((i) => i.clientId)
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true },
    })
    const clientMap = new Map(clients.map((c) => [c.id, c]))

    const now = new Date()
    const detailedInvoices = await prisma.invoice.findMany({
      where: {
        orgId,
        clientId: { in: clientIds },
        status: InvoiceStatus.OVERDUE,
        deletedAt: null,
      },
      select: { clientId: true, dueDate: true },
    })

    const avgDaysLateByClient = new Map<string, number>()
    clientIds.forEach((clientId) => {
      const clientInvoices = detailedInvoices.filter(
        (i) => i.clientId === clientId
      )
      if (clientInvoices.length > 0) {
        const totalDays = clientInvoices.reduce((sum, inv) => {
          const days = Math.floor(
            (now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0)
        avgDaysLateByClient.set(
          clientId,
          Math.round(totalDays / clientInvoices.length)
        )
      }
    })

    return invoices.map((i) => ({
      clientId: i.clientId,
      clientName: clientMap.get(i.clientId)?.name || 'Cliente não encontrado',
      clientEmail: clientMap.get(i.clientId)?.email,
      totalOverdue: i._sum.total || 0,
      invoiceCount: i._count,
      avgDaysLate: avgDaysLateByClient.get(i.clientId) || 0,
    }))
  }

  static async getRecentTransactions(orgId: string, limit: number = 10) {
    const txs = await prisma.transaction.findMany({
      where: { orgId, deletedAt: null },
      include: {
        client: { select: { id: true, name: true } },
        invoice: { select: { id: true, number: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return txs.map((t) => ({ ...t, dueDate: t.date }))
  }

  static async getClientAnalysis(
    clientId: string,
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const [client, margin, invoices, transactions, costSubscriptions] =
      await Promise.all([
        prisma.client.findFirst({
          where: { id: clientId, orgId },
          include: {
            installments: {
              where: { status: { not: 'CONFIRMED' } },
              orderBy: { dueDate: 'asc' },
            },
          },
        }),
        CostTrackingService.calculateClientMargin(
          clientId,
          orgId,
          dateFrom,
          dateTo
        ),
        prisma.invoice.findMany({
          where: {
            clientId,
            orgId,
            deletedAt: null,
            ...(dateFrom || dateTo
              ? {
                  issueDate: {
                    ...(dateFrom && { gte: dateFrom }),
                    ...(dateTo && { lte: dateTo }),
                  },
                }
              : {}),
          },
          include: { items: true },
          orderBy: { issueDate: 'desc' },
        }),
        prisma.transaction.findMany({
          where: {
            clientId,
            orgId,
            deletedAt: null,
            ...(dateFrom || dateTo
              ? {
                  date: {
                    ...(dateFrom && { gte: dateFrom }),
                    ...(dateTo && { lte: dateTo }),
                  },
                }
              : {}),
          },
          orderBy: { date: 'desc' },
        }),
        CostTrackingService.listSubscriptions({
          orgId,
          clientId,
          active: true,
        }),
      ])

    if (!client) throw new Error('Cliente não encontrado')

    return {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        contractValue: client.contractValue,
        contractStart: client.contractStart,
        contractEnd: client.contractEnd,
        plan: client.plan,
        paymentStatus: client.paymentStatus,
      },
      financial: {
        margin,
        invoices: {
          total: invoices.length,
          open: invoices.filter((i) => i.status === InvoiceStatus.OPEN).length,
          paid: invoices.filter((i) => i.status === InvoiceStatus.PAID).length,
          overdue: invoices.filter((i) => i.status === InvoiceStatus.OVERDUE)
            .length,
          totalValue: invoices.reduce((sum, i) => sum + i.total, 0),
        },
        transactions: {
          total: transactions.length,
          income: transactions.filter((t) => t.type === TransactionType.INCOME)
            .length,
          expenses: transactions.filter(
            (t) => t.type === TransactionType.EXPENSE
          ).length,
        },
        costs: {
          subscriptions: costSubscriptions.length,
          monthlyTotal: costSubscriptions.reduce(
            (sum, s) => sum + (s.costItem?.amount || 0),
            0
          ),
        },
      },
      pendingInstallments: client.installments,
      detailedInvoices: invoices,
      detailedTransactions: transactions,
      costDetails: costSubscriptions,
    }
  }

  static async getMonthlyReport(orgId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const [
      transactionSummary,
      invoicesByStatus,
      topClients,
      expensesByCategory,
    ] = await Promise.all([
      TransactionService.getSummary(orgId, startDate, endDate),
      prisma.invoice.groupBy({
        by: ['status'],
        where: {
          orgId,
          issueDate: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
      }),
      this.getTopClientsByRevenue(orgId, startDate, endDate, 5),
      prisma.transaction.groupBy({
        by: ['category'],
        where: {
          orgId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.CONFIRMED,
          date: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ])

    return {
      period: { month, year, startDate, endDate },
      summary: transactionSummary,
      invoices: invoicesByStatus.map((item) => ({
        status: item.status,
        count: item._count,
        total: item._sum.total || 0,
      })),
      topClients,
      expenseBreakdown: expensesByCategory.map((item) => ({
        category: item.category || 'Sem categoria',
        amount: item._sum.amount || 0,
        count: item._count,
      })),
    }
  }

  static async getGlobalSummary(orgId: string, year?: number) {
    const baseWhere: Prisma.TransactionWhereInput = {
      orgId,
      deletedAt: null,
      status: TransactionStatus.CONFIRMED,
    }
    const [overallIncome, overallExpense, minMax] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.INCOME },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...baseWhere, type: TransactionType.EXPENSE },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: baseWhere,
        _min: { date: true },
        _max: { date: true },
      }),
    ])

    const overallTotalIncome = overallIncome._sum.amount || 0
    const overallTotalExpense = overallExpense._sum.amount || 0
    const overallNet = overallTotalIncome - overallTotalExpense
    const overallMargin =
      overallTotalIncome > 0 ? (overallNet / overallTotalIncome) * 100 : 0

    const now = new Date()
    const y = year || now.getFullYear()
    const startOfYear = new Date(y, 0, 1, 0, 0, 0, 0)
    const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999)

    const monthSeries: Array<any> = []
    for (let m = 0; m < 12; m++) {
      const start = new Date(y, m, 1, 0, 0, 0, 0)
      const lastDay = new Date(y, m + 1, 0)
      const end = new Date(
        lastDay.getFullYear(),
        lastDay.getMonth(),
        lastDay.getDate(),
        23,
        59,
        59,
        999
      )

      const [mi, me] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            ...baseWhere,
            type: TransactionType.INCOME,
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            ...baseWhere,
            type: TransactionType.EXPENSE,
            date: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
      ])

      const income = mi._sum.amount || 0
      const expense = me._sum.amount || 0
      const net = income - expense
      const profitMargin = income > 0 ? (net / income) * 100 : 0

      monthSeries.push({ month: m + 1, income, expense, net, profitMargin })
    }

    const yearIncome = monthSeries.reduce((s, r) => s + r.income, 0)
    const yearExpense = monthSeries.reduce((s, r) => s + r.expense, 0)
    const yearNet = yearIncome - yearExpense
    const yearMargin = yearIncome > 0 ? (yearNet / yearIncome) * 100 : 0

    return {
      overall: {
        totalIncome: overallTotalIncome,
        incomeCount: overallIncome._count,
        totalExpense: overallTotalExpense,
        expenseCount: overallExpense._count,
        netProfit: overallNet,
        profitMargin: overallMargin,
        firstDate: minMax._min.date || null,
        lastDate: minMax._max.date || null,
      },
      year: {
        year: y,
        totalIncome: yearIncome,
        totalExpense: yearExpense,
        netProfit: yearNet,
        profitMargin: yearMargin,
      },
      monthly: monthSeries,
      period: { start: startOfYear, end: endOfYear },
    }
  }
}

export default ReportingService
