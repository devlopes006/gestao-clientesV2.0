'use client'

import { DataLoader, PartialDataLoader } from '@/components/DataLoader'
import { FinancialFilter } from '@/components/financeiro/FinancialFilter'
import { InvoiceStatusGrid } from '@/components/financeiro/InvoiceStatusGrid'
import { MetricCard } from '@/components/financeiro/MetricCard'
import { MonthlyPerformanceChart } from '@/components/financeiro/MonthlyPerformanceChart'
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
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
      <DataLoader
        loading={loadingDashboard}
        error={errorDashboard}
        data={dashboardData}
        skeleton={<div className="h-24 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 animate-pulse" />}
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
        <div className="grid gap-5 sm:gap-6 lg:gap-7 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receitas"
            value={financial?.totalIncome || 0}
            subtitle={`Pendente: ${formatCurrency(financial?.pendingIncome || 0)}`}
            type="income"
            icon={<TrendingUp className="h-6 w-6" />}
            delay={0}
          />
          <MetricCard
            title="Despesas"
            value={financial?.totalExpense || 0}
            subtitle={`Pendente: ${formatCurrency(financial?.pendingExpense || 0)}`}
            type="expense"
            icon={<TrendingDown className="h-6 w-6" />}
            delay={0.1}
          />
          <MetricCard
            title="Lucro Líquido"
            value={financial?.netProfit || 0}
            subtitle={`Margem: ${(financial?.profitMargin || 0).toFixed(1)}%`}
            type="profit"
            icon={<DollarSign className="h-6 w-6" />}
            delay={0.2}
          />
          <MetricCard
            title="A Receber"
            value={invoices?.totalReceivable || 0}
            subtitle={`${invoices?.open?.count || 0} faturas em aberto`}
            type="receivable"
            icon={<Wallet className="h-6 w-6" />}
            delay={0.3}
          />
        </div>
      </DataLoader>

      {projections && financial && (
        <div className="grid gap-5 sm:gap-6 lg:gap-7 md:grid-cols-2">
          <MetricCard
            title="Lucro Previsto"
            value={projections.projectedNetProfit}
            subtitle={`Abertas − (Não-fixas confirmadas + Fixas pendentes). Faltam fixas: ${formatCurrency(projections.pendingFixed)}`}
            type="profit"
            icon={<DollarSign className="h-6 w-6" />}
          />
          {typeof projections.cashOnHandMonthly === 'number' && (
            <MetricCard
              title="Em Caixa"
              value={projections.cashOnHandMonthly}
              subtitle="Receitas − Despesas (mês selecionado). Base mensal para conferência."
              type="receivable"
              icon={<Wallet className="h-6 w-6" />}
            />
          )}
          <Card size="md" variant="elevated" className="overflow-hidden border border-red-500/20 bg-gradient-to-br from-slate-900 via-red-950/10 to-slate-900/80 backdrop-blur-xl shadow-2xl hover:shadow-red-500/10 transition-all duration-300">
            <CardHeader className="pb-4 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-rose-500/20 border-b border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-100">Despesas do Mês</CardTitle>
                  <CardDescription className="text-sm text-slate-400">Top 5 categorias</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-red-500/15 to-orange-500/10 border border-red-500/30 shadow-lg">
                <span className="text-sm text-slate-200 font-semibold">Total de despesas</span>
                <span className="text-2xl font-bold text-red-400">{formatCurrency(financial.totalExpense)}</span>
              </div>
              {(() => {
                const items = (financial.byCategory || []).filter((x) => x.type === 'EXPENSE')
                if (!items.length) {
                  return <div className="text-sm text-muted-foreground">Sem despesas neste período.</div>
                }
                const top = items.slice(0, 5)
                return (
                  <div className="space-y-2.5">
                    {top.map((c, index) => (
                      <div key={`${c.category}-${c.amount}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 hover:border-red-500/30 transition-all duration-200 group">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 font-bold text-sm group-hover:bg-red-500/30 transition-colors">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-200 group-hover:text-slate-100 transition-colors">{c.category}</span>
                        </div>
                        <Badge variant="outline" className="bg-red-500/15 text-red-300 border-red-500/30 px-3 py-1 font-semibold group-hover:bg-red-500/25 transition-colors">{formatCurrency(c.amount)}</Badge>
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
        <div className="space-y-6">
          <MonthlyPerformanceChart data={globalSummaryAny.monthly} year={globalSummaryAny.year.year} />

          <Card size="md" variant="elevated" className="border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/10 to-slate-900/90 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1 rounded-t-xl" />
            <CardHeader className="pb-6 pt-6 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent border-b border-blue-500/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 shadow-lg shadow-blue-500/30 border border-blue-500/30">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-white drop-shadow-lg">Resumo Geral da Empresa</CardTitle>
                  <CardDescription className="text-sm text-slate-300">Visão histórica e desempenho no ano selecionado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="grid gap-5 sm:gap-6 lg:gap-7 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Receita Total (Histórico)"
                  value={globalSummaryAny.overall.totalIncome}
                  subtitle={`${globalSummaryAny.overall.incomeCount} entradas`}
                  type="income"
                  icon={<TrendingUp className="h-6 w-6" />}
                />
                <MetricCard
                  title="Despesa Total (Histórico)"
                  value={globalSummaryAny.overall.totalExpense}
                  subtitle={`${globalSummaryAny.overall.expenseCount} saídas`}
                  type="expense"
                  icon={<TrendingDown className="h-6 w-6" />}
                />
                <MetricCard
                  title="Lucro Acumulado"
                  value={globalSummaryAny.overall.netProfit}
                  subtitle={`Margem ${globalSummaryAny.overall.profitMargin.toFixed(1)}%`}
                  type="profit"
                  icon={<DollarSign className="h-6 w-6" />}
                />
                <MetricCard
                  title="Margem Histórica"
                  value={globalSummaryAny.overall.profitMargin}
                  subtitle={`Primeira: ${globalSummaryAny.overall.firstDate || '-'} | Última: ${globalSummaryAny.overall.lastDate || '-'}`}
                  type="profit"
                  icon={<DollarSign className="h-6 w-6" />}
                />
              </div>

              <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
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
        </div>
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

      <div className="grid gap-5 sm:gap-6 lg:gap-7 md:grid-cols-2">
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
        <Card size="md" variant="elevated" className="border border-purple-500/20 bg-gradient-to-br from-slate-900 via-purple-950/10 to-slate-900/80 backdrop-blur-xl shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
          <CardHeader className="pb-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 border-b border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-100">Atividades Recentes</CardTitle>
                <CardDescription className="text-sm text-slate-400">Últimas movimentações confirmadas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-slate-700/40 bg-gradient-to-br from-slate-800/40 to-slate-800/20 p-4 hover:bg-gradient-to-br hover:from-slate-800/60 hover:to-purple-900/20 hover:border-purple-500/40 transition-all duration-300 shadow-sm hover:shadow-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">{item.description || item.type}</div>
                      <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs px-2 py-0.5">{item.status}</Badge>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-purple-400 group-hover:text-purple-300 transition-colors">{formatCurrency(item.amount)}</div>
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
