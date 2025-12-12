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
    const items =
      initial?.activities?.filter((a: any) => a.type === 'meeting') ?? []
    return items.map((m: any) => ({
      id: String(m.id ?? crypto.randomUUID()),
      title: m.title ?? 'Reunião',
      date: new Date(m.date).toLocaleDateString('pt-BR') ?? '',
      client: { name: m.clientName },
    }))
  }, [initial])
}
