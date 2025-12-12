import type { DashboardData } from '@/modules/dashboard/domain/schema'
import { useMemo } from 'react'

export type FinancePoint = { month: string; revenue: number; expenses: number }

export function useFinanceChart(initial?: DashboardData): FinancePoint[] {
  return useMemo(() => {
    const series = initial?.financialData ?? []
    return series.map((p: any) => ({
      month: p.month ?? '—',
      revenue: p.receitas ?? 0,
      expenses: p.despesas ?? 0,
    }))
  }, [initial])
}
