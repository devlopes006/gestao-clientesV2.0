import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

export interface TeamMember {
  id: string
  name: string
  email: string
  image?: string | null
  role: string
}

export function useTeamMembers(orgId?: string) {
  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery<TeamMember[]>({
    queryKey: ['teamMembers', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const res = await fetch(
        `/api/team-members?orgId=${encodeURIComponent(orgId)}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Failed to fetch team members')
      return res.json()
    },
    enabled: !!orgId,
  })

  const [assignLoading, setAssignLoading] = useState(false)

  const assignTask = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      setAssignLoading(true)
      try {
        const res = await fetch(`/api/tasks/v2/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ assignee: assigneeId }),
        })
        if (!res.ok) throw new Error('Failed to assign task')
        return res.json()
      } finally {
        setAssignLoading(false)
      }
    },
    []
  )

  return {
    members,
    isLoading,
    error,
    assignLoading,
    assignTask,
  }
}
