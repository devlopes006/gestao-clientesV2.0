import type { DashboardData } from '@/modules/dashboard/domain/schema'
import { useMemo } from 'react'

export type ActivityItem = {
  id: string
  type: string
  title: string
  time: string
}

export function useActivityFeed(initial?: DashboardData): ActivityItem[] {
  return useMemo(() => {
    const items = initial?.activity?.recent ?? []
    return items.map((a: any, idx: number) => ({
      id: String(a.id ?? idx),
      type: a.type ?? 'update',
      title: a.title ?? 'Atualização',
      time: a.time ?? '',
    }))
  }, [initial])
}
