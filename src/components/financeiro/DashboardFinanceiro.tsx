'use client'

import { DataLoader, PartialDataLoader } from '@/components/DataLoader'
import { FinancialFilter } from '@/components/financeiro/FinancialFilter'
import { InvoiceStatusGrid } from '@/components/financeiro/InvoiceStatusGrid'
import { MetricCard } from '@/components/financeiro/MetricCard'
import { OverdueInvoicesList } from '@/components/financeiro/OverdueInvoicesList'
import { TopClientsCard } from '@/components/financeiro/TopClientsCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CardGridSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/skeleton-loaders'
import { clearDataCache, useFetchData } from '@/hooks/useFetchData'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useCallback, useState } from 'react'
import { FinancialAlerts } from './FinancialAlerts'
import { FinancialHealth } from './FinancialHealth'

const MONTHS_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export function DashboardFinanceiro() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  console.debug('[DashboardFinanceiro] render state ->', { year, month })

  const dashboardUrl = `/api/reports/dashboard?year=${year}&month=${month}`
  const summaryUrl = `/api/reports/summary?year=${year}`

  const {
    data: dashboardData,
    loading: loadingDashboard,
    error: errorDashboard,
    refetch: refetchDashboard,
    isRefetching: isRefetchingDashboard,
  } = useFetchData(dashboardUrl, { cacheTime: 5 * 60 * 1000 })

  const {
    data: globalSummary,
    error: errorSummary,
    refetch: refetchSummary,
    isRefetching: isRefetchingSummary,
  } = useFetchData(summaryUrl, { cacheTime: 10 * 60 * 1000 })

  const globalSummaryAny = globalSummary as any

  const handlePeriodChange = useCallback(
    (newYear: number, newMonth: number) => {
      console.debug('[DashboardFinanceiro] handlePeriodChange ->', { newYear, newMonth })
      setYear(newYear)
      setMonth(newMonth)
      clearDataCache('dashboard')
      clearDataCache('summary')
    },
    [setYear, setMonth]
  )

  const handleRefresh = useCallback(async () => {
    clearDataCache('dashboard')
    clearDataCache('summary')
    await Promise.all([refetchDashboard(), refetchSummary()])
  }, [refetchDashboard, refetchSummary])

  // Estados de erro
  const hasError = errorDashboard || errorSummary
  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {errorDashboard?.message || errorSummary?.message || 'Erro ao carregar dashboard'}
        </AlertDescription>
      </Alert>
    )
  }

  const financial = (dashboardData as any)?.financial
  const invoices = (dashboardData as any)?.invoices
  const overdue = (dashboardData as any)?.overdue
  const topClients = (dashboardData as any)?.topClients
  const recentActivity = (dashboardData as any)?.recentActivity
  const projections = (dashboardData as any)?.projections

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <DataLoader
        loading={loadingDashboard}
        error={errorDashboard}
        data={dashboardData}
        skeleton={<div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />}
      >
        <FinancialAlerts />
      </DataLoader>

      <FinancialFilter
        year={year}
        month={month}
        onPeriodChange={handlePeriodChange}
        onRefresh={handleRefresh}
        loading={isRefetchingDashboard || isRefetchingSummary}
        data={dashboardData || undefined}
      />

      <DataLoader
        loading={loadingDashboard}
        error={errorDashboard}
        data={dashboardData}
        skeleton={<CardGridSkeleton columns={4} count={4} />}
      >
        <div className="grid gap-3 sm:gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receitas"
            value={financial?.totalIncome || 0}
            subtitle={`Pendente: ${formatCurrency(financial?.pendingIncome || 0)}`}
            type="income"
            icon={<TrendingUp className="h-5 w-5" />}
            delay={0}
          />
          <MetricCard
            title="Despesas"
            value={financial?.totalExpense || 0}
            subtitle={`Pendente: ${formatCurrency(financial?.pendingExpense || 0)}`}
            type="expense"
            icon={<TrendingDown className="h-5 w-5" />}
            delay={0.1}
          />
          <MetricCard
            title="Lucro Líquido"
            value={financial?.netProfit || 0}
            subtitle={`Margem: ${(financial?.profitMargin || 0).toFixed(1)}%`}
            type="profit"
            icon={<DollarSign className="h-5 w-5" />}
            delay={0.2}
          />
          <MetricCard
            title="A Receber"
            value={invoices?.totalReceivable || 0}
            subtitle={`${invoices?.open?.count || 0} faturas em aberto`}
            type="receivable"
            icon={<Wallet className="h-5 w-5" />}
            delay={0.3}
          />
        </div>
      </DataLoader>

      {projections && financial && (
        <div className="grid gap-3 sm:gap-4 lg:gap-6 md:grid-cols-2">
          <MetricCard
            title="Lucro Previsto"
            value={projections.projectedNetProfit}
            subtitle={`Abertas − (Não-fixas confirmadas + Fixas pendentes). Faltam fixas: ${formatCurrency(projections.pendingFixed)}`}
            type="profit"
            icon={<DollarSign className="h-5 w-5" />}
          />
          {typeof projections.cashOnHandMonthly === 'number' && (
            <MetricCard
              title="Em Caixa"
              value={projections.cashOnHandMonthly}
              subtitle="Receitas − Despesas (mês selecionado). Base mensal para conferência."
              type="receivable"
              icon={<Wallet className="h-5 w-5" />}
            />
          )}
          <Card size="md" variant="elevated" className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Resumo Despesas do Mês</CardTitle>
              <CardDescription className="text-sm">Total e principais categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Total de despesas</span>
                <span className="text-base font-semibold">{formatCurrency(financial.totalExpense)}</span>
              </div>
              {(() => {
                const items = (financial.byCategory || []).filter((x) => x.type === 'EXPENSE')
                if (!items.length) {
                  return <div className="text-sm text-muted-foreground">Sem despesas neste período.</div>
                }
                const top = items.slice(0, 5)
                return (
                  <div className="space-y-2">
                    {top.map((c) => (
                      <div key={`${c.category}-${c.amount}`} className="flex items-center justify-between">
                        <span className="text-sm">{c.category}</span>
                        <Badge variant="outline">{formatCurrency(c.amount)}</Badge>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {globalSummary && (
        <Card size="md" variant="elevated" className="">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Resumo Geral da Empresa</CardTitle>
            <CardDescription className="text-sm">Visão histórica e desempenho no ano selecionado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 lg:space-y-5">
            <div className="grid gap-3 sm:gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Receita Total (Histórico)"
                value={globalSummaryAny.overall.totalIncome}
                subtitle={`${globalSummaryAny.overall.incomeCount} entradas`}
                type="income"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <MetricCard
                title="Despesa Total (Histórico)"
                value={globalSummaryAny.overall.totalExpense}
                subtitle={`${globalSummaryAny.overall.expenseCount} saídas`}
                type="expense"
                icon={<TrendingDown className="h-5 w-5" />}
              />
              <MetricCard
                title="Lucro Acumulado"
                value={globalSummaryAny.overall.netProfit}
                subtitle={`Margem ${globalSummaryAny.overall.profitMargin.toFixed(1)}%`}
                type="profit"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <MetricCard
                title="Margem Histórica"
                value={globalSummaryAny.overall.profitMargin}
                subtitle={`Primeira: ${globalSummaryAny.overall.firstDate || '-'} | Última: ${globalSummaryAny.overall.lastDate || '-'}`}
                type="profit"
                icon={<DollarSign className="h-5 w-5" />}
              />
            </div>

            <div className="rounded-3xl border-2 border-slate-200/70 dark:border-slate-800/70 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 relative">
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4 lg:mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          Desempenho Mensal ({globalSummaryAny.year.year})
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          Evolução do lucro líquido ao longo do ano
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {(() => {
                        const m = globalSummaryAny.monthly
                        if (!m || m.length === 0) return null
                        const best = m.reduce((a, b) => (b.net > a.net ? b : a))
                        const worst = m.reduce((a, b) => (b.net < a.net ? b : a))
                        const avgIncome = m.reduce((s, x) => s + x.income, 0) / m.length
                        return (
                          <>
                            <Badge className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-md font-bold">
                              Melhor: {MONTHS_NAMES[best.month - 1]}
                            </Badge>
                            <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-md font-bold">
                              Pior: {MONTHS_NAMES[worst.month - 1]}
                            </Badge>
                            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-md font-bold">
                              Média: {formatCurrency(avgIncome)}
                            </Badge>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {(() => {
                    const m = globalSummaryAny.monthly
                    if (!m || m.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">Sem dados para o ano</p>
                        </div>
                      )
                    }

                    const values = m.map((x) => x.net)
                    const w = 1200
                    const h = 180
                    const padding = 20
                    const min = Math.min(...values, 0)
                    const max = Math.max(...values, 0)
                    const range = max - min || 1
                    const stepX = (w - padding * 2) / (values.length - 1 || 1)

                    // Points for main line
                    const points = values
                      .map((v, i) => {
                        const x = padding + i * stepX
                        const y = h - padding - ((v - min) / range) * (h - padding * 2)
                        return `${x},${y}`
                      })
                      .join(' ')

                    // Area gradient fill
                    const areaPoints = `${padding},${h - padding} ${points} ${padding + (values.length - 1) * stepX},${h - padding}`

                    return (
                      <div className="space-y-3">
                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 sm:h-40">
                          <defs>
                            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.3 }} />
                              <stop offset="100%" style={{ stopColor: 'rgb(99, 102, 241)', stopOpacity: 0.05 }} />
                            </linearGradient>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)' }} />
                              <stop offset="50%" style={{ stopColor: 'rgb(99, 102, 241)' }} />
                              <stop offset="100%" style={{ stopColor: 'rgb(139, 92, 246)' }} />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {/* Grid lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = h - padding - ratio * (h - padding * 2)
                            return (
                              <line
                                key={ratio}
                                x1={padding}
                                y1={y}
                                x2={w - padding}
                                y2={y}
                                stroke="currentColor"
                                strokeWidth="1"
                                className="text-slate-200 dark:text-slate-700"
                                strokeDasharray="4 4"
                                opacity="0.5"
                              />
                            )
                          })}

                          {/* Area fill */}
                          <polygon
                            fill="url(#chartGradient)"
                            points={areaPoints}
                          />

                          {/* Main line */}
                          <polyline
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                            filter="url(#glow)"
                          />

                          {/* Data points */}
                          {values.map((v, i) => {
                            const x = padding + i * stepX
                            const y = h - padding - ((v - min) / range) * (h - padding * 2)
                            const isPositive = v >= 0
                            return (
                              <g key={i}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="5"
                                  fill="white"
                                  stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                                  strokeWidth="2.5"
                                  className="hover:r-7 transition-all cursor-pointer"
                                />
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="3"
                                  fill={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                                />
                              </g>
                            )
                          })}
                        </svg>

                        {/* Month labels */}
                        <div className="flex justify-between px-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          {MONTHS_NAMES.map((name, i) => (
                            <span key={i} className="w-8 text-center">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 lg:gap-6 md:grid-cols-2">
              <TopClientsCard
                title="Top Receita"
                items={topClients?.byRevenue || []}
                type="revenue"
              />
              <TopClientsCard
                title="Top Inadimplência"
                items={topClients?.byOverdue || []}
                type="overdue"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <DataLoader
        loading={loadingDashboard}
        error={errorDashboard}
        data={dashboardData}
        skeleton={<CardGridSkeleton columns={2} count={2} />}
      >
        <div className="mt-4">
          <InvoiceStatusGrid invoices={(dashboardData as any)?.invoices} />
        </div>
      </DataLoader>

      <div className="grid gap-3 sm:gap-4 lg:gap-6 md:grid-cols-2">
        <DataLoader
          loading={loadingDashboard}
          error={errorDashboard}
          data={dashboardData}
          skeleton={<TableSkeleton rows={4} />}
        >
          <OverdueInvoicesList overdue={overdue || []} />
        </DataLoader>
      </div>

      <PartialDataLoader
        isRefetching={isRefetchingDashboard || isRefetchingSummary}
        showSkeletonWhileLoading={false}
        skeleton={<ChartSkeleton />}
      >
        <FinancialHealth data={(dashboardData as any)?.financial || null} />
      </PartialDataLoader>

      <DataLoader
        loading={loadingDashboard}
        error={errorDashboard}
        data={dashboardData}
        skeleton={<TableSkeleton rows={5} />}
      >
        <Card size="md" variant="elevated" className="">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Atividades Recentes</CardTitle>
            <CardDescription className="text-sm">Pagamentos, faturas e lançamentos confirmados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold">{item.description || item.type}</div>
                      <div className="text-xs text-muted-foreground">{item.status}</div>
                    </div>
                    <div className="text-sm font-bold">{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Sem atividades recentes.</div>
            )}
          </CardContent>
        </Card>
      </DataLoader>
    </div>
  )
}
