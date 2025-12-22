'use client'

import { MetricCard } from '@/components/financeiro/MetricCard'
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

interface QuickStatsData {
  totalIncome: number
  totalExpense: number
  netProfit: number
  totalReceivable: number
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
      })
    } catch (err) {
      console.error('Erro ao carregar quick stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) return null

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-7">
      <MetricCard
        title="Receitas"
        value={data.totalIncome}
        type="income"
        icon={<TrendingUp className="h-5 w-5" />}
        delay={0}
      />

      <MetricCard
        title="Despesas"
        value={data.totalExpense}
        type="expense"
        icon={<TrendingDown className="h-5 w-5" />}
        delay={0.1}
      />

      <MetricCard
        title="Lucro"
        value={data.netProfit}
        type="profit"
        icon={<DollarSign className="h-5 w-5" />}
        delay={0.2}
      />

      <MetricCard
        title="A Receber"
        value={data.totalReceivable}
        type="receivable"
        icon={<Wallet className="h-5 w-5" />}
        delay={0.3}
      />
    </div>
  )
}
