/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Prisma } from '@prisma/client'
import { z } from 'zod'

/**
 * Advanced Reporting and Analytics Utilities
 * Projeção de receita, análise de inadimplência e métricas financeiras
 */

// Schemas para validação de parâmetros
export const revenueProjectionSchema = z.object({
  months: z.number().min(1).max(24).optional().default(12),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
})

export const delinquencyAnalysisSchema = z.object({
  minDaysOverdue: z.number().min(0).optional().default(0),
  limit: z.number().min(1).max(100).optional().default(50),
})

export type RevenueProjectionParams = z.infer<typeof revenueProjectionSchema>
export type DelinquencyAnalysisParams = z.infer<
  typeof delinquencyAnalysisSchema
>

/**
 * Tipos de Resposta
 */

export interface MonthlyRevenueData {
  month: string // YYYY-MM
  confirmedRevenue: number // Invoices PAID
  projectedRevenue: number // Invoices OPEN com vencimento próximo
  atRiskRevenue: number // Invoices OVERDUE
  totalProjected: number // confirmed + projected + atRisk
  invoiceCount: number
  paidCount: number
  openCount: number
  overdueCount: number
}

export interface ClientRevenueBreakdown {
  clientId: string
  clientName: string
  confirmedRevenue: number
  projectedRevenue: number
  atRiskRevenue: number
  totalProjected: number
  invoiceCount: number
  paidCount: number
  openCount: number
  overdueCount: number
}

export interface RevenueProjectionResponse {
  summary: {
    totalConfirmedRevenue: number
    totalProjectedRevenue: number
    totalAtRiskRevenue: number
    grandTotal: number
    averageMonthlyRevenue: number
    projectionAccuracy: number // 0-100, indica confiabilidade
  }
  monthlyData: MonthlyRevenueData[]
  clientBreakdown: ClientRevenueBreakdown[]
  topClients: {
    byRevenue: ClientRevenueBreakdown[]
    byInvoiceCount: ClientRevenueBreakdown[]
    byOverdueAmount: ClientRevenueBreakdown[]
  }
  metadata: {
    generatedAt: string
    monthsAnalyzed: number
    totalClientsAnalyzed: number
    currency: string
  }
}

export interface ClientDelinquencyData {
  clientId: string
  clientName: string
  clientEmail: string
  clientStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  overdueDays: number
  overdueAmount: number
  invoiceCount: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  paymentSuccessRate: number // Porcentagem de faturas pagas vs total
  lastPaymentDate: string | null
  oldestOverdueDate: string | null
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' // Baseado em dias e valor
}

export interface DelinquencyAnalysisResponse {
  summary: {
    totalClientsAnalyzed: number
    activeClientsCount: number
    inactiveClientsCount: number
    delinquentClientsCount: number
    totalOverdueAmount: number
    averageOverdueDays: number
    delinquencyRate: number // % de clientes com atraso
  }
  byRiskLevel: {
    critical: ClientDelinquencyData[]
    high: ClientDelinquencyData[]
    medium: ClientDelinquencyData[]
    low: ClientDelinquencyData[]
  }
  topDelinquents: ClientDelinquencyData[]
  trends: {
    month: string // YYYY-MM
    delinquentCount: number
    overdueAmount: number
    trend: 'improving' | 'stable' | 'worsening'
  }[]
  metadata: {
    generatedAt: string
    analysisDate: string
    currency: string
  }
}

/**
 * Funções auxiliares para cálculos
 */

export function calculateRiskLevel(
  overdueDays: number,
  overdueAmount: number
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (overdueDays === 0) return 'LOW'
  if (overdueDays < 7 && overdueAmount < 1000) return 'LOW'
  if (overdueDays < 15 && overdueAmount < 5000) return 'MEDIUM'
  if (overdueDays < 30) return 'HIGH'
  return 'CRITICAL'
}

export function calculatePaymentSuccessRate(
  paidCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 100
  return Math.round((paidCount / totalCount) * 100)
}

export function calculateProjectionAccuracy(
  monthsWithData: number,
  totalMonths: number
): number {
  if (totalMonths === 0) return 0
  // Quanto mais meses com dados históricos, mais precisa a projeção
  const accuracy = (monthsWithData / totalMonths) * 100
  return Math.min(accuracy, 100)
}

export function formatCurrency(
  amount: number,
  currency: string = 'BRL'
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function getMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7) // YYYY-MM
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function getDaysOverdue(
  dueDate: Date,
  compareDate: Date = new Date()
): number {
  const diffTime = compareDate.getTime() - dueDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Builders para queries Prisma otimizadas
 */

export function buildRevenueProjectionWhere(
  fromDate: Date,
  toDate: Date,
  orgId: string
): Prisma.InvoiceWhereInput {
  return {
    orgId,
    status: { in: ['PAID', 'OPEN', 'OVERDUE'] },
    issueDate: {
      gte: fromDate,
      lte: toDate,
    },
  }
}

export function buildDelinquencyWhere(
  orgId: string,
  minDaysOverdue: number = 0
): Prisma.InvoiceWhereInput {
  const now = new Date()
  const overdueThresholdDate = new Date(
    now.getTime() - minDaysOverdue * 24 * 60 * 60 * 1000
  )

  return {
    orgId,
    status: 'OVERDUE',
    dueDate: { lte: overdueThresholdDate },
  }
}

/**
 * Agregadores de dados
 */

export function aggregateClientRevenue(
  invoices: any[]
): Map<string, ClientRevenueBreakdown> {
  const clientMap = new Map<string, ClientRevenueBreakdown>()

  for (const invoice of invoices) {
    const clientId = invoice.clientId
    let clientData = clientMap.get(clientId)

    if (!clientData) {
      clientData = {
        clientId,
        clientName: invoice.client?.name || 'Unknown',
        confirmedRevenue: 0,
        projectedRevenue: 0,
        atRiskRevenue: 0,
        totalProjected: 0,
        invoiceCount: 0,
        paidCount: 0,
        openCount: 0,
        overdueCount: 0,
      }
    }

    clientData.invoiceCount += 1

    switch (invoice.status) {
      case 'PAID':
        clientData.confirmedRevenue += invoice.total || 0
        clientData.paidCount += 1
        break
      case 'OPEN':
        clientData.projectedRevenue += invoice.total || 0
        clientData.openCount += 1
        break
      case 'OVERDUE':
        clientData.atRiskRevenue += invoice.total || 0
        clientData.overdueCount += 1
        break
    }

    clientData.totalProjected =
      clientData.confirmedRevenue +
      clientData.projectedRevenue +
      clientData.atRiskRevenue
    clientMap.set(clientId, clientData)
  }

  return clientMap
}

export function aggregateMonthlyRevenue(
  invoices: any[]
): Map<string, MonthlyRevenueData> {
  const monthMap = new Map<string, MonthlyRevenueData>()

  for (const invoice of invoices) {
    const month = getMonthKey(new Date(invoice.issueDate))
    let monthData = monthMap.get(month)

    if (!monthData) {
      monthData = {
        month,
        confirmedRevenue: 0,
        projectedRevenue: 0,
        atRiskRevenue: 0,
        totalProjected: 0,
        invoiceCount: 0,
        paidCount: 0,
        openCount: 0,
        overdueCount: 0,
      }
    }

    monthData.invoiceCount += 1

    switch (invoice.status) {
      case 'PAID':
        monthData.confirmedRevenue += invoice.total || 0
        monthData.paidCount += 1
        break
      case 'OPEN':
        monthData.projectedRevenue += invoice.total || 0
        monthData.openCount += 1
        break
      case 'OVERDUE':
        monthData.atRiskRevenue += invoice.total || 0
        monthData.overdueCount += 1
        break
    }

    monthData.totalProjected =
      monthData.confirmedRevenue +
      monthData.projectedRevenue +
      monthData.atRiskRevenue
    monthMap.set(month, monthData)
  }

  return monthMap
}

export function aggregateClientDelinquency(
  invoices: any[]
): Map<string, ClientDelinquencyData> {
  const clientMap = new Map<string, ClientDelinquencyData>()
  const now = new Date()

  for (const invoice of invoices) {
    const clientId = invoice.clientId
    let clientData = clientMap.get(clientId)

    if (!clientData) {
      clientData = {
        clientId,
        clientName: invoice.client?.name || 'Unknown',
        clientEmail: invoice.client?.email || 'unknown@email.com',
        clientStatus: invoice.client?.status || 'INACTIVE',
        overdueDays: 0,
        overdueAmount: 0,
        invoiceCount: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        paymentSuccessRate: 0,
        lastPaymentDate: null,
        oldestOverdueDate: null,
        riskLevel: 'LOW',
      }
    }

    clientData.invoiceCount += 1

    if (invoice.status === 'PAID') {
      clientData.paidCount += 1
      if (
        !clientData.lastPaymentDate ||
        new Date(invoice.paidDate) > new Date(clientData.lastPaymentDate)
      ) {
        clientData.lastPaymentDate = invoice.paidDate
          ? new Date(invoice.paidDate).toISOString()
          : null
      }
    } else if (invoice.status === 'OPEN') {
      clientData.pendingCount += 1
    } else if (invoice.status === 'OVERDUE') {
      clientData.overdueCount += 1
      const daysOverdue = getDaysOverdue(new Date(invoice.dueDate), now)
      clientData.overdueDays = Math.max(clientData.overdueDays, daysOverdue)
      clientData.overdueAmount += invoice.total || 0

      if (
        !clientData.oldestOverdueDate ||
        new Date(invoice.dueDate) < new Date(clientData.oldestOverdueDate)
      ) {
        clientData.oldestOverdueDate = new Date(invoice.dueDate).toISOString()
      }
    }

    clientData.paymentSuccessRate = calculatePaymentSuccessRate(
      clientData.paidCount,
      clientData.invoiceCount
    )
    clientData.riskLevel = calculateRiskLevel(
      clientData.overdueDays,
      clientData.overdueAmount
    )

    clientMap.set(clientId, clientData)
  }

  return clientMap
}

/**
 * Funções de ordenação para top N
 */

export function topClientsByRevenue(
  clients: ClientRevenueBreakdown[],
  limit: number = 10
): ClientRevenueBreakdown[] {
  return [...clients]
    .sort((a, b) => b.totalProjected - a.totalProjected)
    .slice(0, limit)
}

export function topClientsByInvoiceCount(
  clients: ClientRevenueBreakdown[],
  limit: number = 10
): ClientRevenueBreakdown[] {
  return [...clients]
    .sort((a, b) => b.invoiceCount - a.invoiceCount)
    .slice(0, limit)
}

export function topClientsByOverdueAmount(
  clients: ClientDelinquencyData[],
  limit: number = 10
): ClientDelinquencyData[] {
  return [...clients]
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, limit)
}

export function groupDelinquenciesByRiskLevel(
  clients: ClientDelinquencyData[]
): {
  critical: ClientDelinquencyData[]
  high: ClientDelinquencyData[]
  medium: ClientDelinquencyData[]
  low: ClientDelinquencyData[]
} {
  return {
    critical: clients.filter((c) => c.riskLevel === 'CRITICAL'),
    high: clients.filter((c) => c.riskLevel === 'HIGH'),
    medium: clients.filter((c) => c.riskLevel === 'MEDIUM'),
    low: clients.filter((c) => c.riskLevel === 'LOW'),
  }
}

/**
 * Funções para análise de tendências
 */

export function analyzeTrendDirection(
  current: number,
  previous: number
): 'improving' | 'stable' | 'worsening' {
  const diff = current - previous
  const percentChange = previous !== 0 ? (diff / previous) * 100 : 0

  if (Math.abs(percentChange) < 5) return 'stable'
  return percentChange < 0 ? 'improving' : 'worsening'
}

export function calculateMonthlyTrends(
  monthlyData: Map<string, MonthlyRevenueData>
): Array<{
  month: string
  delinquentCount: number
  overdueAmount: number
  trend: 'improving' | 'stable' | 'worsening'
}> {
  const sortedMonths = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      delinquentCount: data.overdueCount,
      overdueAmount: data.atRiskRevenue,
    }))

  const trendsWithAnalysis = sortedMonths.map((current, index) => ({
    ...current,
    trend:
      index === 0
        ? ('stable' as const)
        : analyzeTrendDirection(
            current.overdueAmount,
            sortedMonths[index - 1].overdueAmount
          ),
  }))

  return trendsWithAnalysis
}
