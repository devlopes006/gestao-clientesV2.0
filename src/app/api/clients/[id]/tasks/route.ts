import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { sanitizeObject } from '@/lib/sanitize'
import {
  createTaskSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { sendTaskAssignmentEmail } from '@/services/email/resend'
import { sendSmtpMail } from '@/services/email/smtp'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit listagem de tarefas
    const idKey = getIdentifier(_request as unknown as Request)
    const rl = await checkRateLimit(idKey, apiRatelimit)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
    }
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'read', 'task'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { id: clientId } = await params

    // Verifica se o cliente pertence à org
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client)
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )

    const sp = new URL(_request.url).searchParams
    const query = taskListQuerySchema.safeParse({
      limit: sp.get('limit') ?? undefined,
      cursor: sp.get('cursor') ?? undefined,
    })
    if (!query.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: query.error.format() },
        { status: 400 }
      )
    }
    const { limit, cursor } = query.data
    const take = Math.min(limit ?? 50, 200)

    const tasks = await prisma.task.findMany({
      where: { clientId, orgId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assignee: true,
        dueDate: true,
        clientId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    })
    const hasNextPage = tasks.length > take
    const data = tasks.slice(0, take)
    const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null
    return NextResponse.json({
      data,
      meta: { limit: take, nextCursor, hasNextPage },
    })
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    // If debug requested, expose details to caller for faster debugging (only when explicitly asked)
    const debugRequested =
      process.env.DEBUG === 'true' ||
      (typeof process !== 'undefined' &&
        _request.headers?.get?.('x-debug') === '1')

    if (debugRequested) {
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas', details: String(error) },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao buscar tarefas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit criação de tarefa
    const idKey = getIdentifier(request as unknown as Request)
    const rl = await checkRateLimit(idKey, apiRatelimit)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
    }
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'create', 'task'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { id: clientId } = await params
    const body = await request.json()

    // Validate with Zod
    const validated = createTaskSchema.parse(body)

    // Sanitize user-generated content
    const sanitized = await sanitizeObject(validated, {
      textFields: ['title', 'description', 'assignee'],
    })

    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client)
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )

    // Normalize dueDate to a valid Date or null
    const normalizedDueDate =
      sanitized.dueDate instanceof Date && !isNaN(sanitized.dueDate.getTime())
        ? sanitized.dueDate
        : null

    const task = await prisma.task.create({
      data: {
        clientId,
        orgId,
        title: sanitized.title,
        description: sanitized.description ?? null,
        status: (sanitized.status?.toUpperCase() as any) ?? 'TODO',
        priority: (sanitized.priority?.toUpperCase() as any) ?? 'MEDIUM',
        assignee: sanitized.assignee ?? null,
        dueDate: normalizedDueDate,
      },
    })

    // Envia email para o responsável, se houver
    if (sanitized.assignee) {
      try {
        const assigneeUser = await prisma.user.findUnique({
          where: { id: sanitized.assignee },
          select: { email: true, name: true },
        })
        const org = await prisma.org.findUnique({
          where: { id: orgId },
          select: {
            name: true,
            owner: { select: { name: true, email: true } },
          },
        })
        const clientName = client?.name || null
        const assignerName = user.name || user.email
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.APP_BASE_URL ||
          'http://localhost:3000'
        const taskLink = `${baseUrl}/clients/${clientId}?tab=tasks`

        if (assigneeUser?.email) {
          // Tenta Resend, se não disponível, usa SMTP
          let sent = false
          try {
            const result = await sendTaskAssignmentEmail({
              to: assigneeUser.email,
              assigneeName: assigneeUser.name,
              assignerName,
              taskTitle: task.title,
              clientName,
              orgName: org?.name || null,
              dueDate: task.dueDate,
              taskLink,
            })
            sent = !result.skipped
          } catch (err) {
            sent = false
          }
          if (!sent) {
            // SMTP fallback
            const subject = `[Tarefa atribuída] ${task.title}`
            const safeAssignee = assigneeUser.name || 'Você'
            const safeAssigner = assignerName || 'Gestão de Clientes'
            const safeOrg = org?.name || 'sua organização'
            const safeClient = clientName ? ` • Cliente: ${clientName}` : ''
            const dueText = task.dueDate
              ? `Prazo: ${task.dueDate.toLocaleDateString('pt-BR')}`
              : ''
            const html = `
              <html>
                <body style="margin:0;padding:24px;background:#0b1220;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial;color:#e2e8f0;">
                  <div style="max-width:640px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 18px 60px rgba(0,0,0,0.35);background:linear-gradient(135deg,#0f172a 0%,#0b1220 40%,#111827 100%);">
                    <div style="padding:18px 20px;border-bottom:1px solid #1f2937;background:linear-gradient(135deg,#111827,#0b1220);">
                      <p style="margin:0;font-size:13px;color:#94a3b8;letter-spacing:0.3px;">${safeOrg}</p>
                      <h1 style="margin:6px 0 0 0;font-size:20px;color:#f8fafc;">${safeAssignee}, você recebeu uma nova tarefa</h1>
                    </div>
                    <div style="padding:22px 24px;">
                      <p style="margin:0 0 10px 0;font-size:15px;color:#e2e8f0;line-height:1.5;"><strong style="color:#93c5fd;">Tarefa:</strong> ${task.title}</p>
                      ${clientName ? `<p style=\"margin:0 0 8px 0;font-size:14px;color:#cbd5e1;line-height:1.5;\"><strong style=\\"color:#93c5fd;\">Cliente:</strong> ${clientName}</p>` : ''}
                      ${dueText ? `<p style=\"margin:0 0 12px 0;font-size:14px;color:#cbd5e1;line-height:1.5;\"><strong style=\\"color:#93c5fd;\">Prazo:</strong> ${dueText.replace('Prazo: ', '')}</p>` : ''}
                      <p style="margin:0 0 16px 0;font-size:14px;color:#cbd5e1;">Atribuída por <strong style="color:#f8fafc;">${safeAssigner}</strong>.</p>
                      <a href="${taskLink}" style="display:inline-block;padding:12px 18px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;box-shadow:0 10px 35px rgba(59,130,246,0.35);">Ver tarefa</a>
                      <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">Se o botão não funcionar, copie e cole este link no navegador:<br/><span style="color:#60a5fa;word-break:break-all;">${taskLink}</span></p>
                    </div>
                  </div>
                </body>
              </html>
            `
            const text = `${safeAssignee}, você recebeu uma nova tarefa: ${task.title} ${safeClient}\n${dueText}\nAtribuída por: ${safeAssigner}\n${taskLink}`
            await sendSmtpMail({
              to: assigneeUser.email,
              subject,
              html,
              text,
              from: org?.owner?.email
                ? `${org.owner.name || 'Owner'} <${org.owner.email}>`
                : undefined,
            })
          }
        }
      } catch (err) {
        console.warn('[task assignment email] falhou', err)
      }
    }

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao criar tarefa:', error)
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit atualização de tarefa
    const idKey = getIdentifier(request as unknown as Request)
    const rl = await checkRateLimit(idKey, apiRatelimit)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
    }
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'update', 'task'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    const { id: clientId } = await params
    if (!taskId)
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })

    const body = await request.json()

    // Validate with Zod (partial for updates)
    const validated = updateTaskSchema.parse(body)

    // Sanitize user-generated content
    const sanitized = await sanitizeObject(validated, {
      textFields: ['title', 'description', 'assignee'],
    })

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task || task.orgId !== orgId)
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )

    const normalizedUpdateDueDate =
      sanitized.dueDate instanceof Date && !isNaN(sanitized.dueDate.getTime())
        ? sanitized.dueDate
        : sanitized.dueDate === null
          ? null
          : undefined

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: sanitized.title,
        description: sanitized.description,
        status: sanitized.status
          ? (sanitized.status.toUpperCase() as any)
          : undefined,
        priority: sanitized.priority
          ? (sanitized.priority.toUpperCase() as any)
          : undefined,
        assignee: sanitized.assignee,
        // Only update dueDate if provided; set to null if explicitly null
        ...(normalizedUpdateDueDate !== undefined && {
          dueDate: normalizedUpdateDueDate,
        }),
      },
    })

    // Se mudou/definiu responsável, enviar email
    if (sanitized.assignee) {
      try {
        const assigneeUser = await prisma.user.findUnique({
          where: { id: sanitized.assignee },
          select: { email: true, name: true },
        })
        const client = await prisma.client.findFirst({
          where: { id: clientId, orgId },
          select: { name: true },
        })
        const org = await prisma.org.findUnique({
          where: { id: orgId },
          select: {
            name: true,
            owner: { select: { name: true, email: true } },
          },
        })
        const assignerName = user?.name || user?.email
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.APP_BASE_URL ||
          'http://localhost:3000'
        const taskLink = `${baseUrl}/clients/${clientId}?tab=tasks`

        if (assigneeUser?.email) {
          // Tenta Resend, se não disponível, usa SMTP
          let sent = false
          try {
            const result = await sendTaskAssignmentEmail({
              to: assigneeUser.email,
              assigneeName: assigneeUser.name,
              assignerName,
              taskTitle: updated.title,
              clientName: client?.name || null,
              orgName: org?.name || null,
              dueDate: updated.dueDate,
              taskLink,
            })
            sent = !result.skipped
          } catch (err) {
            sent = false
          }
          if (!sent) {
            // SMTP fallback
            const subject = `[Tarefa atribuída] ${updated.title}`
            const safeAssignee = assigneeUser.name || 'Você'
            const safeAssigner = assignerName || 'Gestão de Clientes'
            const safeOrg = org?.name || 'sua organização'
            const safeClient = client?.name ? ` • Cliente: ${client.name}` : ''
            const dueText = updated.dueDate
              ? `Prazo: ${updated.dueDate.toLocaleDateString('pt-BR')}`
              : ''
            const html = `
              <html>
                <body style="margin:0;padding:24px;background:#0b1220;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial;color:#e2e8f0;">
                  <div style="max-width:640px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 18px 60px rgba(0,0,0,0.35);background:linear-gradient(135deg,#0f172a 0%,#0b1220 40%,#111827 100%);">
                    <div style="padding:18px 20px;border-bottom:1px solid #1f2937;background:linear-gradient(135deg,#111827,#0b1220);">
                      <p style="margin:0;font-size:13px;color:#94a3b8;letter-spacing:0.3px;">${safeOrg}</p>
                      <h1 style="margin:6px 0 0 0;font-size:20px;color:#f8fafc;">${safeAssignee}, você recebeu uma nova tarefa</h1>
                    </div>
                    <div style="padding:22px 24px;">
                      <p style="margin:0 0 10px 0;font-size:15px;color:#e2e8f0;line-height:1.5;"><strong style="color:#93c5fd;">Tarefa:</strong> ${updated.title}</p>
                      ${client?.name ? `<p style=\"margin:0 0 8px 0;font-size:14px;color:#cbd5e1;line-height:1.5;\"><strong style=\\"color:#93c5fd;\">Cliente:</strong> ${client.name}</p>` : ''}
                      ${dueText ? `<p style=\"margin:0 0 12px 0;font-size:14px;color:#cbd5e1;line-height:1.5;\"><strong style=\\"color:#93c5fd;\">Prazo:</strong> ${dueText.replace('Prazo: ', '')}</p>` : ''}
                      <p style="margin:0 0 16px 0;font-size:14px;color:#cbd5e1;">Atribuída por <strong style="color:#f8fafc;">${safeAssigner}</strong>.</p>
                      <a href="${taskLink}" style="display:inline-block;padding:12px 18px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;box-shadow:0 10px 35px rgba(59,130,246,0.35);">Ver tarefa</a>
                      <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">Se o botão não funcionar, copie e cole este link no navegador:<br/><span style="color:#60a5fa;word-break:break-all;">${taskLink}</span></p>
                    </div>
                  </div>
                </body>
              </html>
            `
            const text = `${safeAssignee}, você recebeu uma nova tarefa: ${updated.title} ${safeClient}\n${dueText}\nAtribuída por: ${safeAssigner}\n${taskLink}`
            await sendSmtpMail({
              to: assigneeUser.email,
              subject,
              html,
              text,
              from: org?.owner?.email
                ? `${org.owner.name || 'Owner'} <${org.owner.email}>`
                : undefined,
            })
          }
        }
      } catch (err) {
        console.warn('[task assignment email] falhou', err)
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar tarefa:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit deleção de tarefa
    const idKey = getIdentifier(request as unknown as Request)
    const rl = await checkRateLimit(idKey, apiRatelimit)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
    }
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'delete', 'task'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const url = new URL(request.url)
    const taskId = url.searchParams.get('taskId')
    if (!taskId)
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task || task.orgId !== orgId)
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )

    await prisma.task.delete({ where: { id: taskId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar tarefa' },
      { status: 500 }
    )
  }
}
