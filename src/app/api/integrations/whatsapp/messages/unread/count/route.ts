import { adminAuth } from '@/lib/firebaseAdmin'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/integrations/whatsapp/messages/unread/count
 * Retorna o número de mensagens não lidas do WhatsApp
 */
export async function GET(request: NextRequest) {
  try {
    // Obter token de autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verificar token Firebase
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (error) {
      console.error('Erro ao verificar token:', error)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const firebaseUid = decodedToken.uid

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        memberships: {
          where: { isActive: true },
          include: { org: true },
        },
      },
    })

    if (!user || !user.memberships.length) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou sem organizações' },
        { status: 404 }
      )
    }

    // Pegar a primeira organização ativa
    const orgId = user.memberships[0].orgId

    // Contar mensagens não lidas RECEBIDAS (from != null, evento de mensagem)
    const unreadCount = await prisma.whatsAppMessage.count({
      where: {
        orgId,
        isRead: false,
        event: 'message',
        from: { not: null }, // Apenas mensagens recebidas
      },
    })

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Erro ao buscar contagem de mensagens não lidas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contagem de mensagens não lidas' },
      { status: 500 }
    )
  }
}
