import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const from = searchParams.get('from')
    const orgId = searchParams.get('orgId')

    const where: any = {}
    if (from) where.from = from
    if (orgId) where.orgId = orgId

    const messages = await prisma.whatsAppMessage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    })
  } catch (error) {
    console.error('[WhatsApp Messages API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// PATCH /api/integrations/whatsapp/messages
// Body: { thread: string, name: string }
// Atualiza o nome do cliente e normaliza nas mensagens
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const raw = body.thread || ''
    const name = (body.name || '').trim()
    const thread = raw.replace(/\D/g, '')
    const threadPlus = raw.startsWith('+') ? raw : `+${thread}`

    if (!thread) {
      return NextResponse.json(
        { error: 'thread é obrigatório' },
        { status: 400 }
      )
    }
    if (!name) {
      return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 })
    }

    const updatedClient = await prisma.client.updateMany({
      where: {
        OR: [{ phone: thread }, { phone: threadPlus }],
      },
      data: { name },
    })

    const updatedMsgs = await prisma.whatsAppMessage.updateMany({
      where: {
        OR: [
          { from: thread },
          { to: thread },
          { recipientId: thread },
          { from: threadPlus },
          { to: threadPlus },
          { recipientId: threadPlus },
        ],
      },
      data: { name },
    })

    return NextResponse.json({
      success: true,
      updatedClient: updatedClient.count,
      updatedMessages: updatedMsgs.count,
    })
  } catch (error) {
    console.error('[WhatsApp Messages PATCH] Error:', error)
    return NextResponse.json(
      {
        error: 'Falha ao atualizar conversa',
        detail: (error as Error)?.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/integrations/whatsapp/messages?thread=+5541999998888
// Apaga todas as mensagens de uma conversa (por telefone normalizado)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const raw = searchParams.get('thread') || ''
    const thread = raw.replace(/\D/g, '')
    const threadPlus = raw.startsWith('+') ? raw : `+${thread}`

    if (!thread) {
      return NextResponse.json(
        { error: 'Parâmetro thread é obrigatório' },
        { status: 400 }
      )
    }

    const result = await prisma.whatsAppMessage.deleteMany({
      where: {
        OR: [
          { from: thread },
          { to: thread },
          { recipientId: thread },
          { from: threadPlus },
          { to: threadPlus },
          { recipientId: threadPlus },
        ],
      },
    })

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('[WhatsApp Messages DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Falha ao apagar conversa', detail: (error as Error)?.message },
      { status: 500 }
    )
  }
}
