'use server'

import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { revalidatePath } from 'next/cache'

export async function createDashboardNote(data: {
  title: string
  content: string
  color?: string
}) {
  const session = await getSessionProfile()
  if (!session.orgId) {
    throw new Error('Organization not found')
  }

  // Get the highest position
  const lastNote = await prisma.dashboardNote.findFirst({
    where: { orgId: session.orgId },
    orderBy: { position: 'desc' },
  })

  // sanitize inputs
  const titleSanitized = (data.title || '').trim()
  const contentSanitized = (data.content || '').trim()
  const safeTitle =
    titleSanitized.length > 0
      ? titleSanitized
      : contentSanitized.length > 0
        ? contentSanitized.slice(0, 60)
        : 'Sem título'

  const note = await prisma.dashboardNote.create({
    data: {
      title: safeTitle,
      content: contentSanitized,
      color: data.color || 'yellow',
      position: (lastNote?.position ?? -1) + 1,
      orgId: session.orgId,
    },
  })

  revalidatePath('/dashboard')
  return note
}

export async function getDashboardNotes() {
  const session = await getSessionProfile()
  if (!session.orgId) {
    return []
  }

  const notes = await prisma.dashboardNote.findMany({
    where: {
      orgId: session.orgId,
    },
    orderBy: {
      position: 'asc',
    },
  })

  return notes
}

export async function updateDashboardNote(
  id: string,
  data: {
    title?: string
    content?: string
    color?: string
    position?: number
  }
) {
  const session = await getSessionProfile()
  if (!session.orgId) {
    throw new Error('Organization not found')
  }

  // sanitize inputs
  const titleSanitized =
    data.title !== undefined ? (data.title || '').trim() : undefined
  const contentSanitized =
    data.content !== undefined ? (data.content || '').trim() : undefined
  const safeTitle =
    titleSanitized !== undefined
      ? titleSanitized.length > 0
        ? titleSanitized
        : (() => {
            const c = contentSanitized ?? ''
            return c.length > 0 ? c.slice(0, 60) : 'Sem título'
          })()
      : undefined

  const note = await prisma.dashboardNote.update({
    where: {
      id,
      orgId: session.orgId,
    },
    data: {
      ...(safeTitle !== undefined && { title: safeTitle }),
      ...(contentSanitized !== undefined && { content: contentSanitized }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.position !== undefined && { position: data.position }),
    },
  })

  revalidatePath('/dashboard')
  return note
}

export async function deleteDashboardNote(id: string) {
  const session = await getSessionProfile()
  if (!session.orgId) {
    throw new Error('Organization not found')
  }

  await prisma.dashboardNote.delete({
    where: {
      id,
      orgId: session.orgId,
    },
  })

  revalidatePath('/dashboard')
}
