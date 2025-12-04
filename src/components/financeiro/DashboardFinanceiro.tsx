'use client'

import { InvoiceStatusGrid } from '@/components/financeiro/InvoiceStatusGrid'
import { MetricCard } from '@/components/financeiro/MetricCard'
import { OverdueInvoicesList } from '@/components/financeiro/OverdueInvoicesList'
import { TopClientsCard } from '@/components/financeiro/TopClientsCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { exportDashboard } from '@/lib/export-utils'
import { formatCurrency } from '@/lib/utils'
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Download,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { FinancialAlerts } from './FinancialAlerts'
import { FinancialHealth } from './FinancialHealth'

interface DashboardData {
  financial: {
    totalIncome: number
    totalExpense: number
    netProfit: number
    profitMargin: number
    pendingIncome: number
    pendingExpense: number
    byCategory?: Array<{
      type: string
      category: string
      amount: number
      count: number
    }>
  }
  invoices: {
    open: { count: number; total: number }
    paid: { count: number; total: number }
    overdue: { count: number; total: number }
    cancelled: { count: number; total: number }
    totalReceivable: number
  }
  overdue: Array<{
    id: string
    number: string
    clientId: string
    client: {
      id: string
      name: string
      email: string | null
      phone: string | null
    }
    total: number
    dueDate: Date
    daysLate: number
  }>
  topClients: {
    byRevenue: Array<{
      clientId: string
      clientName: string
      totalRevenue: number
      invoiceCount: number
    }>
    byOverdue: Array<{
      clientId: string
      clientName: string
      totalOverdue: number
      overdueCount: number
    }>
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string | null
    amount: number
    dueDate: Date
    status: string
  }>
  projections?: {
    monthlyFixedTotal: number
    materializedFixedThisPeriod: number
    pendingFixed: number
    projectedNetProfit: number
    cashOnHand?: number
    cashOnHandMonthly?: number
    incomeToDate?: number
    expenseToDate?: number
  }
}

// Resumo global (histórico + série mensal do ano vigente)
interface GlobalSummary {
  overall: {
    totalIncome: number
    incomeCount: number
    totalExpense: number
    expenseCount: number
    netProfit: number
    profitMargin: number
    firstDate: string | null
    lastDate: string | null
  }
  year: {
    year: number
    totalIncome: number
    totalExpense: number
    netProfit: number
    profitMargin: number
  }
  monthly: Array<{
    month: number
    income: number
    expense: number
    net: number
    profitMargin: number
  }>
}


const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function DashboardFinanceiro() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [globalSummary, setGlobalSummary] = useState<GlobalSummary | null>(null)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/reports/dashboard?year=${year}&month=${month}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar dashboard')
      }

      const result = await response.json()
      setData(result)
      // Carrega resumo global do ano selecionado
      const sRes = await fetch(`/api/reports/summary?year=${year}`)
      if (sRes.ok) {
        const s = await sRes.json()
        setGlobalSummary(s)
      } else {
        setGlobalSummary(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Erro ao carregar dados'}</AlertDescription>
      </Alert>
    )
  }

  const { financial, invoices, overdue, topClients, recentActivity } = data

  return (
    <div className="space-y-8">
      {/* Alertas Financeiros */}
      <FinancialAlerts />

      {/* Filtro de Período */}
      <Card className="border-2 border-border/50 shadow-lg bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-lg">Período:</span>
            </div>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-4 py-2.5 border-2 rounded-xl font-medium transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Selecionar mês"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-4 py-2.5 border-2 rounded-xl font-medium transition-all hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Selecionar ano"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Button
              variant="default"
              onClick={fetchDashboard}
              className="shadow-md hover:shadow-lg transition-all"
            >
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => exportDashboard(data, { year, month })}
              className="gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receitas"
          value={financial.totalIncome}
          subtitle={`Pendente: ${formatCurrency(financial.pendingIncome)}`}
          type="income"
          icon={<TrendingUp className="h-5 w-5" />}
          delay={0}
        />
        <MetricCard
          title="Despesas"
          value={financial.totalExpense}
          subtitle={`Pendente: ${formatCurrency(financial.pendingExpense)}`}
          type="expense"
          icon={<TrendingDown className="h-5 w-5" />}
          delay={0.1}
        />
        <MetricCard
          title="Lucro Líquido"
          value={financial.netProfit}
          subtitle={`Margem: ${financial.profitMargin.toFixed(1)}%`}
          type="profit"
          icon={<DollarSign className="h-5 w-5" />}
          delay={0.2}
        />
        <MetricCard
          title="A Receber"
          value={invoices.totalReceivable}
          subtitle={`${invoices.open.count} faturas em aberto`}
          type="receivable"
          icon={<Wallet className="h-5 w-5" />}
          delay={0.3}
        />
      </div>

      {/* Projeção de Lucro, Caixa e Resumo de Despesas do Mês */}
      {data.projections && (
        <div className="grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Lucro Previsto"
            value={data.projections.projectedNetProfit}
            subtitle={`Abertas − (Não-fixas confirmadas + Fixas pendentes). Faltam fixas: ${formatCurrency(data.projections.pendingFixed)}`}
            type="profit"
            icon={<DollarSign className="h-5 w-5" />}
          />
          {typeof data.projections.cashOnHandMonthly === 'number' && (
            <MetricCard
              title="Em Caixa"
              value={data.projections.cashOnHandMonthly}
              subtitle="Receitas − Despesas (mês selecionado). Base mensal para conferência."
              type="receivable"
              icon={<Wallet className="h-5 w-5" />}
            />
          )}
          {/* Opcional: histórico de caixa poderia ir em um tooltip/sidetext */}
          <Card className="border-2 border-border/50 shadow-lg">
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

      {/* Resumo Geral da Empresa (moderno e enxuto) */}
      {globalSummary && (
        <Card className="border-2 border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Resumo Geral da Empresa</CardTitle>
            <CardDescription className="text-sm">Visão histórica e desempenho no ano selecionado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Histórico (tudo) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Receita Total (Histórico)"
                value={globalSummary.overall.totalIncome}
                subtitle={`${globalSummary.overall.incomeCount} entradas`}
                type="income"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <MetricCard
                title="Despesa Total (Histórico)"
                value={globalSummary.overall.totalExpense}
                subtitle={`${globalSummary.overall.expenseCount} saídas`}
                type="expense"
                icon={<TrendingDown className="h-5 w-5" />}
              />
              <MetricCard
                title="Lucro Acumulado"
                value={globalSummary.overall.netProfit}
                subtitle={`Margem ${globalSummary.overall.profitMargin.toFixed(1)}%`}
                type="profit"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <MetricCard
                title={`Ano ${globalSummary.year.year}`}
                value={globalSummary.year.netProfit}
                subtitle={`${formatCurrency(globalSummary.year.totalIncome)} - ${formatCurrency(globalSummary.year.totalExpense)}`}
                type="profit"
                icon={<Wallet className="h-5 w-5" />}
              />
            </div>

            {/* Série mensal com sparkline leve */}
            <div className="rounded-xl border p-4 bg-gradient-to-br from-background via-background to-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Desempenho Mensal ({globalSummary.year.year})</span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {(() => {
                    const m = globalSummary.monthly
                    if (!m || m.length === 0) return null
                    const best = m.reduce((a, b) => (b.net > a.net ? b : a))
                    const worst = m.reduce((a, b) => (b.net < a.net ? b : a))
                    const avgIncome = m.reduce((s, x) => s + x.income, 0) / m.length
                    return (
                      <>
                        <Badge variant="outline">Melhor: {MONTHS[best.month - 1]}</Badge>
                        <Badge variant="outline">Pior: {MONTHS[worst.month - 1]}</Badge>
                        <Badge variant="outline">Média Receita: {formatCurrency(avgIncome)}</Badge>
                      </>
                    )
                  })()}
                </div>
              </div>
              {(() => {
                const m = globalSummary.monthly
                if (!m || m.length === 0) return <div className="text-sm text-muted-foreground">Sem dados para o ano.</div>
                const values = m.map((x) => x.net)
                const w = 520
                const h = 60
                const min = Math.min(...values, 0)
                const max = Math.max(...values, 0)
                const range = max - min || 1
                const stepX = w / (values.length - 1 || 1)
                const points = values.map((v, i) => {
                  const x = i * stepX
                  const y = h - ((v - min) / range) * h
                  return `${x},${y}`
                })
                return (
                  <div className="overflow-x-auto">
                    <svg width={w} height={h} className="block">
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        className="text-primary"
                        strokeWidth="2"
                        points={points.join(' ')}
                      />
                      {/* Zero line */}
                      {min < 0 && max > 0 && (
                        <line
                          x1={0}
                          x2={w}
                          y1={h - ((0 - min) / range) * h}
                          y2={h - ((0 - min) / range) * h}
                          className="stroke-muted-foreground/30"
                          strokeWidth="1"
                        />
                      )}
                    </svg>
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}



      {/* Status de Faturas */}
      <InvoiceStatusGrid invoices={invoices} />

      {/* Saúde Financeira */}
      <FinancialHealth data={financial} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Faturas Vencidas */}
        <OverdueInvoicesList overdue={overdue} />

        {/* Top Clientes por Receita */}
        <TopClientsCard clients={topClients.byRevenue} />
      </div>

      {/* Atividade Recente */}
      <Card className="border-2 border-border/50 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 h-1" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Atividade Recente
              </CardTitle>
              <CardDescription className="text-sm">
                Últimas {recentActivity.length} movimentações financeiras
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-16 w-16 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {recentActivity.slice(0, 10).map((activity) => (
                <Card key={activity.id} className="border hover:shadow-md transition-all duration-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl shadow-sm flex-shrink-0 ${activity.type === 'INCOME'
                        ? 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30'
                        : 'bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/30 dark:to-red-900/30'
                        }`}>
                        {activity.type === 'INCOME' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate mb-1">
                          {activity.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-black ${activity.type === 'INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                          }`}>
                          {activity.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(activity.amount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
