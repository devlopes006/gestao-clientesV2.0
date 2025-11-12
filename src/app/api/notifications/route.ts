import { adminAuth } from '@/lib/firebaseAdmin'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const firebaseUid = decoded.uid

    // Busca o usuário e sua org
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { memberships: { include: { org: true } } },
    })

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orgId = user.memberships[0].orgId
    const appUserId = user.id

    // Buscar tarefas urgentes, reuniões próximas e pagamentos pendentes
    const [urgentTasks, upcomingMeetings, overdueInstallments] =
      await Promise.all([
        // Tasks urgentes (alta prioridade ou atrasadas)
        prisma.task.findMany({
          where: {
            orgId,
            OR: [
              { priority: 'high', status: { notIn: ['done', 'completed'] } },
              {
                dueDate: { lt: new Date() },
                status: { notIn: ['done', 'completed'] },
              },
            ],
          },
          take: 5,
          orderBy: { dueDate: 'asc' },
          include: {
            client: { select: { id: true, name: true } },
          },
        }),

        // Reuniões nas próximas 24 horas
        prisma.meeting.findMany({
          where: {
            client: { orgId },
            startTime: {
              gte: new Date(),
              lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
          take: 5,
          orderBy: { startTime: 'asc' },
          include: {
            client: { select: { id: true, name: true } },
          },
        }),

        // Parcelas atrasadas
        prisma.installment.findMany({
          where: {
            client: { orgId },
            dueDate: { lt: new Date() },
            paidAt: null,
          },
          take: 5,
          orderBy: { dueDate: 'asc' },
          include: {
            client: { select: { id: true, name: true } },
          },
        }),
      ])

    // Montar notificações (dinâmicas)
    const notifications: Array<{
      id: string
      type: string
      title: string
      message: string
      time: string
      unread: boolean
      link: string
      priority?: string
      clientId: string
    }> = []

    // Adicionar tasks urgentes
    urgentTasks.forEach((task) => {
      const isOverdue = task.dueDate && task.dueDate < new Date()
      notifications.push({
        id: `task-${task.id}`,
        type: 'task',
        title: isOverdue ? 'Tarefa Atrasada' : 'Tarefa Urgente',
        message: `${task.title} - ${task.client.name}`,
        time: getTimeAgo(task.dueDate || task.createdAt),
        unread: true,
        link: `/clients/${task.clientId}/tasks`,
        priority: task.priority,
        clientId: task.clientId,
      })
    })

    // Adicionar reuniões próximas
    upcomingMeetings.forEach((meeting) => {
      notifications.push({
        id: `meeting-${meeting.id}`,
        type: 'meeting',
        title: 'Reunião Próxima',
        message: `${meeting.title} - ${meeting.client.name}`,
        time: getTimeAgo(meeting.startTime),
        unread: true,
        link: `/clients/${meeting.clientId}/meetings`,
        clientId: meeting.clientId,
      })
    })

    // Adicionar parcelas atrasadas
    overdueInstallments.forEach((installment) => {
      const daysOverdue = Math.floor(
        (Date.now() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      notifications.push({
        id: `installment-${installment.id}`,
        type: 'payment',
        title: 'Pagamento Atrasado',
        message: `R$ ${installment.amount.toFixed(2)} - ${
          installment.client.name
        } (${daysOverdue}d)`,
        time: getTimeAgo(installment.dueDate),
        unread: true,
        link: `/clients/${installment.clientId}/finance`,
        clientId: installment.clientId,
      })
    })

    // Buscar notificações já lidas no banco para este usuário
    const readNotifs = await prisma.notification.findMany({
      where: { userId: appUserId, orgId, read: true },
      select: { id: true },
    })
    const readIds = new Set(readNotifs.map((n) => n.id))

    // Marcar como lidas conforme o banco
    for (const n of notifications) {
      if (readIds.has(n.id)) {
        n.unread = false
      }
    }

    // Ordenar por prioridade de tipo
    notifications.sort((a, b) => {
      // Priorizar por tipo: task > payment > meeting
      const typeOrder = { task: 0, payment: 1, meeting: 2 }
      return (
        typeOrder[a.type as keyof typeof typeOrder] -
        typeOrder[b.type as keyof typeof typeOrder]
      )
    })

    return NextResponse.json({
      notifications: notifications.slice(0, 10), // Limitar a 10
      unreadCount: notifications.filter((n) => n.unread).length,
    })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 0) {
    const futureSeconds = Math.abs(seconds)
    if (futureSeconds < 60) return 'agora'
    if (futureSeconds < 3600) return `em ${Math.floor(futureSeconds / 60)}min`
    if (futureSeconds < 86400) return `em ${Math.floor(futureSeconds / 3600)}h`
    return `em ${Math.floor(futureSeconds / 86400)}d`
  }

  if (seconds < 60) return 'agora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`
  return `${Math.floor(seconds / 86400)}d atrás`
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const firebaseUid = decoded.uid

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { memberships: true },
    })
    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const orgId = user.memberships[0].orgId

    const body = await req.json()
    const { id } = body || {}
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Persistir estado de leitura por usuário/org. Usa o próprio "id" do item dinâmico
    await prisma.notification.upsert({
      where: { id },
      update: { read: true, userId: user.id, orgId },
      create: {
        id,
        read: true,
        userId: user.id,
        orgId,
        type: 'custom',
        title: 'read-marker',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  }
}
