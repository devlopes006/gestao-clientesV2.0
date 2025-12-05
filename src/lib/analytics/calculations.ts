/**
 * Advanced Analytics Calculations
 *
 * Funções para cálculos de análise de dados, lucratividade, tendências e métricas avançadas
 */

/**
 * Dados de receita consolidados
 */
export interface RevenueData {
  month: string
  revenue: number
  cost: number
  profit: number
  profitMargin: number
}

/**
 * Análise de lucratividade por cliente
 */
export interface ClientProfitability {
  clientId: string
  clientName: string
  revenue: number
  cost: number
  profit: number
  profitMargin: number
  invoiceCount: number
  avgInvoiceValue: number
}

/**
 * Dados de tendência
 */
export interface TrendData {
  period: string
  value: number
  trend: 'up' | 'down' | 'stable'
  changePercent: number
}

/**
 * Sumário de analytics
 */
export interface AnalyticsSummary {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  avgProfitMargin: number
  revenueGrowth: number
  costGrowth: number
  profitGrowth: number
  topClientByRevenue: { name: string; revenue: number }
  topClientByProfit: { name: string; profit: number }
  lowestMarginClient: { name: string; margin: number }
}

/**
 * Calcular receita mensal consolidada
 */
export function calculateMonthlyRevenue(
  invoices: any[],
  costs: any[]
): RevenueData[] {
  const revenueMap = new Map<string, { revenue: number; cost: number }>()

  // Agregar receitas por mês
  for (const invoice of invoices) {
    const month = new Date(invoice.issueDate).toISOString().slice(0, 7) // YYYY-MM
    const current = revenueMap.get(month) || { revenue: 0, cost: 0 }

    if (invoice.status === 'PAID') {
      current.revenue += invoice.total || 0
    }

    revenueMap.set(month, current)
  }

  // Agregar custos por mês
  for (const cost of costs) {
    const month = new Date(cost.date).toISOString().slice(0, 7)
    const current = revenueMap.get(month) || { revenue: 0, cost: 0 }
    current.cost += cost.amount || 0
    revenueMap.set(month, current)
  }

  // Converter para array e calcular profit
  return Array.from(revenueMap.entries())
    .map(([month, data]) => {
      const profit = data.revenue - data.cost
      const profitMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0

      return {
        month,
        revenue: data.revenue,
        cost: data.cost,
        profit,
        profitMargin,
      }
    })
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Calcular lucratividade por cliente
 */
export function calculateClientProfitability(
  clients: any[],
  invoices: any[],
  costs: any[]
): ClientProfitability[] {
  const clientMap = new Map<string, ClientProfitability>()

  // Inicializar dados de clientes
  for (const client of clients) {
    clientMap.set(client.id, {
      clientId: client.id,
      clientName: client.name,
      revenue: 0,
      cost: 0,
      profit: 0,
      profitMargin: 0,
      invoiceCount: 0,
      avgInvoiceValue: 0,
    })
  }

  // Agregar receitas por cliente
  for (const invoice of invoices) {
    const clientData = clientMap.get(invoice.clientId)
    if (clientData && invoice.status === 'PAID') {
      clientData.revenue += invoice.total || 0
      clientData.invoiceCount += 1
    }
  }

  // Agregar custos por cliente
  for (const cost of costs) {
    const clientData = clientMap.get(cost.clientId)
    if (clientData) {
      clientData.cost += cost.amount || 0
    }
  }

  // Calcular profit e margem
  return Array.from(clientMap.values())
    .map((data) => {
      data.profit = data.revenue - data.cost
      data.profitMargin =
        data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
      data.avgInvoiceValue =
        data.invoiceCount > 0 ? data.revenue / data.invoiceCount : 0

      return data
    })
    .filter((data) => data.revenue > 0) // Apenas clientes com receita
    .sort((a, b) => b.profit - a.profit) // Ordenar por profit decrescente
}

/**
 * Calcular tendência de crescimento
 */
export function calculateGrowthTrend(
  current: number,
  previous: number
): { trend: 'up' | 'down' | 'stable'; changePercent: number } {
  if (previous === 0) {
    return { trend: 'up', changePercent: 100 }
  }

  const changePercent = ((current - previous) / previous) * 100
  const threshold = 2 // % de threshold para considerar stable

  let trend: 'up' | 'down' | 'stable'
  if (changePercent > threshold) {
    trend = 'up'
  } else if (changePercent < -threshold) {
    trend = 'down'
  } else {
    trend = 'stable'
  }

  return { trend, changePercent: Math.round(changePercent * 100) / 100 }
}

/**
 * Calcular sumário de analytics
 */
export function calculateAnalyticsSummary(
  revenueData: RevenueData[],
  profitabilityData: ClientProfitability[]
): AnalyticsSummary {
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)
  const totalCost = revenueData.reduce((sum, d) => sum + d.cost, 0)
  const totalProfit = revenueData.reduce((sum, d) => sum + d.profit, 0)
  const avgProfitMargin =
    revenueData.length > 0
      ? revenueData.reduce((sum, d) => sum + d.profitMargin, 0) /
        revenueData.length
      : 0

  // Calcular crescimentos (comparando primeiro vs último período)
  const revenueGrowth =
    revenueData.length >= 2
      ? calculateGrowthTrend(
          revenueData[revenueData.length - 1].revenue,
          revenueData[0].revenue
        ).changePercent
      : 0

  const costGrowth =
    revenueData.length >= 2
      ? calculateGrowthTrend(
          revenueData[revenueData.length - 1].cost,
          revenueData[0].cost
        ).changePercent
      : 0

  const profitGrowth =
    revenueData.length >= 2
      ? calculateGrowthTrend(
          revenueData[revenueData.length - 1].profit,
          revenueData[0].profit
        ).changePercent
      : 0

  // Top e bottom clients
  const topClientByRevenue = [...profitabilityData].sort(
    (a, b) => b.revenue - a.revenue
  )[0] || { name: 'N/A', revenue: 0 }
  const topClientByProfit = [...profitabilityData].sort(
    (a, b) => b.profit - a.profit
  )[0] || {
    name: 'N/A',
    profit: 0,
  }
  const lowestMarginClient = [...profitabilityData].sort(
    (a, b) => a.profitMargin - b.profitMargin
  )[0] || {
    name: 'N/A',
    margin: 0,
  }

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    avgProfitMargin: Math.round(avgProfitMargin * 100) / 100,
    revenueGrowth,
    costGrowth,
    profitGrowth,
    topClientByRevenue: {
      name: topClientByRevenue.clientName,
      revenue: topClientByRevenue.revenue,
    },
    topClientByProfit: {
      name: topClientByProfit.clientName,
      profit: topClientByProfit.profit,
    },
    lowestMarginClient: {
      name: lowestMarginClient.clientName,
      margin: lowestMarginClient.profitMargin,
    },
  }
}

/**
 * Formatar número como moeda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formatar número como percentual
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals)}%`
}

/**
 * Gerar dados de exemplo para charts (desenvolvimento)
 */
export function generateMockAnalyticsData(): {
  revenue: RevenueData[]
  profitability: ClientProfitability[]
  summary: AnalyticsSummary
} {
  const mockRevenue: RevenueData[] = [
    {
      month: '2025-01',
      revenue: 45000,
      cost: 30000,
      profit: 15000,
      profitMargin: 33.3,
    },
    {
      month: '2025-02',
      revenue: 52000,
      cost: 32000,
      profit: 20000,
      profitMargin: 38.5,
    },
    {
      month: '2025-03',
      revenue: 48000,
      cost: 31000,
      profit: 17000,
      profitMargin: 35.4,
    },
    {
      month: '2025-04',
      revenue: 58000,
      cost: 34000,
      profit: 24000,
      profitMargin: 41.4,
    },
    {
      month: '2025-05',
      revenue: 65000,
      cost: 36000,
      profit: 29000,
      profitMargin: 44.6,
    },
  ]

  const mockProfitability: ClientProfitability[] = [
    {
      clientId: 'cli_1',
      clientName: 'Empresa A',
      revenue: 85000,
      cost: 45000,
      profit: 40000,
      profitMargin: 47.1,
      invoiceCount: 12,
      avgInvoiceValue: 7083,
    },
    {
      clientId: 'cli_2',
      clientName: 'Empresa B',
      revenue: 72000,
      cost: 38000,
      profit: 34000,
      profitMargin: 47.2,
      invoiceCount: 24,
      avgInvoiceValue: 3000,
    },
    {
      clientId: 'cli_3',
      clientName: 'Empresa C',
      revenue: 55000,
      cost: 32000,
      profit: 23000,
      profitMargin: 41.8,
      invoiceCount: 18,
      avgInvoiceValue: 3056,
    },
  ]

  const summary = calculateAnalyticsSummary(mockRevenue, mockProfitability)

  return {
    revenue: mockRevenue,
    profitability: mockProfitability,
    summary,
  }
}
