import type { DashboardData } from '@/modules/dashboard/domain/schema'
import { useMemo } from 'react'

export type DashboardKPIs = {
  revenueTotal: number
  expensesTotal: number
  netIncome: number
  tasksTodo: number
  tasksInProgress: number
  tasksReview: number
  tasksDone: number
  clientsActive: number
}

export function useDashboardKPIs(initial?: DashboardData): DashboardKPIs {
  return useMemo(() => {
    const revenue = initial?.finance?.summary?.revenueTotal ?? 0
    const expenses = initial?.finance?.summary?.expensesTotal ?? 0
    const net = revenue - expenses
    const tasks = initial?.tasks?.summary ?? {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    }
    const clientsActive = initial?.clients?.activeCount ?? 0
    return {
      revenueTotal: revenue,
      expensesTotal: expenses,
      netIncome: net,
      tasksTodo: tasks.TODO ?? 0,
      tasksInProgress: tasks.IN_PROGRESS ?? 0,
      tasksReview: tasks.REVIEW ?? 0,
      tasksDone: tasks.DONE ?? 0,
      clientsActive,
    }
  }, [initial])
}
