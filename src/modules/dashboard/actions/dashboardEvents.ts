'use server'

import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { revalidatePath } from 'next/cache'

export async function createDashboardEvent(data: {
  title: string
  description?: string
  date: Date | string
  color?: string
}) {
  const session = await getSessionProfile()
  if (!session.orgId) {
    throw new Error('Organization not found')
  }

  const event = await prisma.dashboardEvent.create({
    data: {
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      color: data.color || 'blue',
      orgId: session.orgId,
    },
  })

  revalidatePath('/dashboard')
  return event
}

export async function getDashboardEvents(monthKey?: string) {
  const session = await getSessionProfile()
  if (!session.orgId) {
    return []
  }

  let startDate: Date
  let endDate: Date

  if (monthKey) {
    const [year, month] = monthKey.split('-').map(Number)
    startDate = new Date(year, month - 1, 1)
    endDate = new Date(year, month, 0, 23, 59, 59)
  } else {
    // Current month
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  }

  const events = await prisma.dashboardEvent.findMany({
    where: {
      orgId: session.orgId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  return events
}

export async function updateDashboardEvent(
  id: string,
  data: {
    title?: string
    description?: string
    date?: Date | string
    color?: string
  }
) {
  const session = await getSessionProfile()
  if (!session.orgId) {
    throw new Error('Organization not found')
  }

  // Apenas OWNER pode editar eventos
  if (session.role !== 'OWNER') {
    throw new Error('Unauthorized: Only OWNER can edit events')
  }

  const event = await prisma.dashboardEvent.update({
    where: {
      id,
      orgId: session.orgId,
    },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.color && { color: data.color }),
    },
  })

  revalidatePath('/dashboard')
  return event
}

export async function deleteDashboardEvent(id: string) {
  const session = await getSessionProfile()
  if (!session.orgId) {
    throw new Error('Organization not found')
  }

  // Apenas OWNER pode deletar eventos
  if (session.role !== 'OWNER') {
    throw new Error('Unauthorized: Only OWNER can delete events')
  }

  await prisma.dashboardEvent.delete({
    where: {
      id,
      orgId: session.orgId,
    },
  })

  revalidatePath('/dashboard')
}
