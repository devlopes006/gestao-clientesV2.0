import type { DashboardData } from '@/modules/dashboard/domain/schema'
import { useMemo } from 'react'

export type FinancePoint = { month: string; revenue: number; expenses: number }

export function useFinanceChart(initial?: DashboardData): FinancePoint[] {
  return useMemo(() => {
    const series = initial?.finance?.series ?? []
    return series.map((p: any) => ({
      month: p.month ?? '—',
      revenue: p.revenue ?? 0,
      expenses: p.expenses ?? 0,
    }))
  }, [initial])
}
