import type { DashboardData } from '@/modules/dashboard/domain/schema'
import { useMemo } from 'react'

export type TasksSummary = {
  byStatus: Record<string, number>
  byPriority: Record<string, number>
}

export function useTasksSummary(initial?: DashboardData): TasksSummary {
  return useMemo(() => {
    const tasks = initial?.tasks ?? []
    const byStatus = {
      TODO: tasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      REVIEW: tasks.filter((t) => t.status === 'REVIEW').length,
      DONE: tasks.filter((t) => t.status === 'DONE').length,
    }
    const byPriority = {
      LOW: tasks.filter((t) => t.priority === 'LOW').length,
      MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
      URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
    }
    return { byStatus, byPriority }
  }, [initial])
}
