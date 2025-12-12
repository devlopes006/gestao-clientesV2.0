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
    const revenue =
      initial?.financialData?.reduce(
        (sum, item) => sum + (item.receitas || 0),
        0
      ) ?? 0
    const expenses =
      initial?.financialData?.reduce(
        (sum, item) => sum + (item.despesas || 0),
        0
      ) ?? 0
    const net = revenue - expenses
    const tasks = initial?.tasks ?? []
    const taskCounts = {
      TODO: tasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      REVIEW: tasks.filter((t) => t.status === 'REVIEW').length,
      DONE: tasks.filter((t) => t.status === 'DONE').length,
    }
    const clientsActive = initial?.clients?.length ?? 0
    return {
      revenueTotal: revenue,
      expensesTotal: expenses,
      netIncome: net,
      tasksTodo: taskCounts.TODO,
      tasksInProgress: taskCounts.IN_PROGRESS,
      tasksReview: taskCounts.REVIEW,
      tasksDone: taskCounts.DONE,
      clientsActive,
    }
  }, [initial])
}
