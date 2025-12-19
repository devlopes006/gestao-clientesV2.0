import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
          { recipient_id: thread },
          { from: threadPlus },
          { to: threadPlus },
          { recipientId: threadPlus },
          { recipient_id: threadPlus },
        ],
      },
    })

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('[WhatsApp Messages DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Falha ao apagar conversa' },
      { status: 500 }
    )
  }
}
