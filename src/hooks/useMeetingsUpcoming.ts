import type { DashboardData } from '@/modules/dashboard/domain/schema'
import { useMemo } from 'react'

export type MeetingItem = {
  id: string
  title: string
  date: string
  client?: { name?: string }
}

export function useMeetingsUpcoming(initial?: DashboardData): MeetingItem[] {
  return useMemo(() => {
    const items = initial?.meetings?.upcoming ?? []
    return items.map((m: any) => ({
      id: String(m.id ?? crypto.randomUUID()),
      title: m.title ?? 'Reunião',
      date: m.date ?? '',
      client: m.client ?? {},
    }))
  }, [initial])
}
