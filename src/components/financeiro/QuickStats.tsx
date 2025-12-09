'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

interface QuickStatsData {
  totalIncome: number
  totalExpense: number
  netProfit: number
  totalReceivable: number
  pendingExpense?: number
  projectedNetProfit?: number
  cashOnHand?: number
  cashOnHandMonthly?: number
}

export function QuickStats() {
  const [data, setData] = useState<QuickStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const year = new Date().getFullYear()
      const month = new Date().getMonth() + 1
      const response = await fetch(`/api/reports/dashboard?year=${year}&month=${month}`)

      if (!response.ok) throw new Error('Erro ao carregar estatísticas')

      const result = await response.json()
      const dashboardData = result.data || result
      setData({
        totalIncome: dashboardData.financial?.totalIncome || 0,
        totalExpense: dashboardData.financial?.totalExpense || 0,
        netProfit: dashboardData.financial?.netProfit || 0,
        totalReceivable: dashboardData.invoices?.totalReceivable || 0,
        pendingExpense: dashboardData.financial?.pendingExpense ?? 0,
        projectedNetProfit: dashboardData.projections?.projectedNetProfit ?? undefined,
        cashOnHand: dashboardData.projections?.cashOnHand ?? undefined,
        cashOnHandMonthly: dashboardData.projections?.cashOnHandMonthly ?? undefined,
      })
    } catch (err) {
      console.error('Erro ao carregar quick stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border bg-white">
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const cards = [
    {
      title: 'Receitas',
      icon: <TrendingUp className="h-5 w-5 text-emerald-700" />,
      value: formatCurrency(data.totalIncome),
      helper: undefined,
    },
    {
      title: 'Despesas',
      icon: <TrendingDown className="h-5 w-5 text-rose-700" />,
      value: formatCurrency(data.totalExpense),
      helper:
        typeof data.pendingExpense === 'number' && data.pendingExpense > 0
          ? `Pendente: ${formatCurrency(data.pendingExpense)}`
          : undefined,
    },
    {
      title: 'Lucro',
      icon: <DollarSign className="h-5 w-5 text-blue-700" />,
      value: formatCurrency(data.netProfit),
      helper:
        typeof data.projectedNetProfit === 'number'
          ? `Previsto: ${formatCurrency(data.projectedNetProfit)}`
          : undefined,
    },
    {
      title: 'A receber',
      icon: <Wallet className="h-5 w-5 text-indigo-700" />,
      value: formatCurrency(data.totalReceivable),
      helper:
        typeof data.cashOnHandMonthly === 'number'
          ? `Em caixa: ${formatCurrency(data.cashOnHandMonthly)}`
          : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent className="space-y-1 pb-4">
            <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
            {card.helper && <p className="text-xs text-slate-600">{card.helper}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
