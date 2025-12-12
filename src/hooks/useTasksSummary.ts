import type { DashboardData } from '@/modules/dashboard/domain/schema'
import { useMemo } from 'react'

export type TasksSummary = {
  byStatus: Record<string, number>
  byPriority: Record<string, number>
}

export function useTasksSummary(initial?: DashboardData): TasksSummary {
  return useMemo(() => {
    const byStatus = initial?.tasks?.summary ?? {}
    const byPriority = initial?.tasks?.byPriority ?? {}
    return { byStatus, byPriority }
  }, [initial])
}
