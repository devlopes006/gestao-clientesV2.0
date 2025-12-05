'use client'

import { KpiGrid, MetricCard, TrendChart } from '@/components/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsSummary, ClientProfitability, RevenueData } from '@/lib/analytics/calculations'
import { formatCurrency, formatPercent } from '@/lib/analytics/calculations'
import { AlertCircle, DollarSign, Target, TrendingUp } from 'lucide-react'

export interface RevenueChartProps {
  data: RevenueData[]
  isLoading?: boolean
  title?: string
  description?: string
}

export interface ProfitabilityChartProps {
  data: ClientProfitability[]
  isLoading?: boolean
  title?: string
  description?: string
  limit?: number
}

export interface AnalyticsSummaryProps {
  summary: AnalyticsSummary
  isLoading?: boolean
}

/**
 * RevenueChart Component
 *
 * Exibe receita vs custo ao longo do tempo com visualização de lucro
 *
 * @example
 * ```tsx
 * <RevenueChart
 *   data={revenueData}
 *   title="Receita Mensal"
 *   description="Últimos 12 meses"
 * />
 * ```
 */
export function RevenueChart({
  data,
  isLoading,
  title = 'Receita vs Custo',
  description = 'Comparação mensal',
}: RevenueChartProps) {
  const chartData = data.map((item) => ({
    name: new Date(item.month + '-01').toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit',
    }),
    Receita: item.revenue / 1000, // Convert para milhares
    Custo: item.cost / 1000,
    Lucro: item.profit / 1000,
  }))

  return (
    <TrendChart
      title={title}
      description={description}
      type="area"
      data={chartData}
      dataKeys={['Receita', 'Custo', 'Lucro']}
      color="rgb(16, 185, 129)" // Emerald para receita
      secondaryColor="rgb(239, 68, 68)" // Red para custo
      formatTooltip={(value) => formatCurrency(value * 1000)}
      formatYAxis={(value) => `R$ ${value}k`}
      yAxisLabel="Valor (mil R$)"
      showLegend
      isLoading={isLoading}
      height={350}
    />
  )
}

/**
 * ProfitabilityChart Component
 *
 * Exibe lucratividade por cliente em gráfico de barras
 *
 * @example
 * ```tsx
 * <ProfitabilityChart
 *   data={profitabilityData}
 *   limit={5}
 *   title="Top 5 Clientes"
 * />
 * ```
 */
export function ProfitabilityChart({
  data,
  isLoading,
  title = 'Lucratividade por Cliente',
  description = 'Top clientes por lucro',
  limit = 5,
}: ProfitabilityChartProps) {
  const topClients = data.slice(0, limit).map((item) => ({
    name: item.clientName,
    Lucro: item.profit / 1000,
    Margem: Math.round(item.profitMargin),
  }))

  return (
    <TrendChart
      title={title}
      description={description}
      type="bar"
      data={topClients}
      dataKeys={['Lucro']}
      color="rgb(168, 85, 247)" // Purple
      formatTooltip={(value) => formatCurrency(value * 1000)}
      formatYAxis={(value) => `R$ ${value}k`}
      yAxisLabel="Lucro (mil R$)"
      isLoading={isLoading}
      height={300}
    />
  )
}

/**
 * AnalyticsSummaryCards Component
 *
 * Exibe cards de sumário com principais métricas
 */
export function AnalyticsSummaryCards({
  summary,
  isLoading,
}: AnalyticsSummaryProps) {
  return (
    <KpiGrid columns={4} gap="md">
      {/* Total Revenue */}
      <MetricCard
        icon={DollarSign}
        value={formatCurrency(summary.totalRevenue)}
        label="Receita Total"
        description={`Crescimento: ${formatPercent(summary.revenueGrowth)}`}
        variant="emerald"
        trend={summary.revenueGrowth > 0 ? 'up' : summary.revenueGrowth < 0 ? 'down' : 'neutral'}
        trendValue={formatPercent(summary.revenueGrowth)}
        isLoading={isLoading}
      />

      {/* Total Profit */}
      <MetricCard
        icon={TrendingUp}
        value={formatCurrency(summary.totalProfit)}
        label="Lucro Total"
        description={`Crescimento: ${formatPercent(summary.profitGrowth)}`}
        variant="blue"
        trend={summary.profitGrowth > 0 ? 'up' : summary.profitGrowth < 0 ? 'down' : 'neutral'}
        trendValue={formatPercent(summary.profitGrowth)}
        isLoading={isLoading}
      />

      {/* Avg Profit Margin */}
      <MetricCard
        icon={Target}
        value={formatPercent(summary.avgProfitMargin)}
        label="Margem Média"
        description={`de ${summary.totalRevenue > 0 ? 'Receita' : 'N/A'}`}
        variant="purple"
        progress={Math.min(100, summary.avgProfitMargin)}
        isLoading={isLoading}
      />

      {/* Lowest Margin Alert */}
      {summary.bottomClientByProfit && (
        <MetricCard
          icon={AlertCircle}
          value={summary.bottomClientByProfit.clientName}
          label="Menor Margem"
          description={formatPercent(summary.bottomClientByProfit.profitMargin)}
          variant="orange"
          isLoading={isLoading}
        />
      )}
    </KpiGrid>
  )
}

/**
 * Detailed Profitability Table Component
 */
export function ProfitabilityTable({
  data,
  isLoading,
}: ProfitabilityChartProps & { title?: never; description?: never }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Detalhada por Cliente</CardTitle>
        <CardDescription>Top clientes por lucratividade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-muted-foreground">
                <th className="text-left py-2 px-3">Cliente</th>
                <th className="text-right py-2 px-3">Receita</th>
                <th className="text-right py-2 px-3">Custo</th>
                <th className="text-right py-2 px-3">Lucro</th>
                <th className="text-right py-2 px-3">Margem</th>
                <th className="text-right py-2 px-3">Faturas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((client) => (
                <tr
                  key={client.clientId}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-3 font-medium">{client.clientName}</td>
                  <td className="text-right py-3 px-3 text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(client.revenue)}
                  </td>
                  <td className="text-right py-3 px-3 text-red-600 dark:text-red-400">
                    {formatCurrency(client.cost)}
                  </td>
                  <td className="text-right py-3 px-3 font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(client.profit)}
                  </td>
                  <td className="text-right py-3 px-3">
                    <span
                      className={
                        client.profitMargin >= 40
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : client.profitMargin >= 30
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-orange-600 dark:text-orange-400'
                      }
                    >
                      {formatPercent(client.profitMargin)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-3 text-muted-foreground">
                    {client.invoiceCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
