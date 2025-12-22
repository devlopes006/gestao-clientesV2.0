import { getAdminAuth } from '@/lib/firebaseAdmin'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/integrations/whatsapp/messages/mark-read
 * Marca mensagens de uma conversa como lidas
 */
export async function POST(request: NextRequest) {
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
      const adminAuth = await getAdminAuth()
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

    // Obter o telefone da conversa do body
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefone não fornecido' },
        { status: 400 }
      )
    }

    // Normalizar telefone (apenas dígitos)
    const normalizedPhone = phone.replace(/\D/g, '')

    // Marcar como lidas todas as mensagens RECEBIDAS (from = phone) dessa conversa
    try {
      const result = await prisma.whatsAppMessage.updateMany({
        where: {
          orgId,
          isRead: false,
          event: 'message',
          from: { contains: normalizedPhone }, // Mensagens recebidas desse número
        },
        data: {
          isRead: true,
        },
      })

      return NextResponse.json({ success: true, updated: result.count })
    } catch (err) {
      const isPrismaMissingTable =
        typeof err === 'object' &&
        err !== null &&
        'code' in (err as any) &&
        ((err as any).code === 'P2021' || (err as any).code === 'P2022')
      if (isPrismaMissingTable) {
        console.warn('[WhatsApp mark-read] Tabela/coluna ausente, noop')
        return NextResponse.json({ success: true, updated: 0 })
      }
      throw err
    }
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar mensagens como lidas' },
      { status: 500 }
    )
  }
}
