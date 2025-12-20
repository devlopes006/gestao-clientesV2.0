import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 0

function verifySignature(secret: string, payload: string, sig?: string | null) {
  if (!secret) return true
  if (!sig) return false
  const h = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig))
  } catch {
    return false
  }
}

/**
 * Normaliza número de telefone para formato consistente
 */
function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, '')

  if (clean.startsWith('55')) {
    return `+${clean}`
  }

  if (clean.length === 11 || clean.length === 10) {
    return `+55${clean}`
  }

  return clean.startsWith('+') ? clean : `+${clean}`
}

/**
 * Busca cliente pelo telefone (melhorada com múltiplas estratégias)
 */
async function findClientByPhone(phone: string) {
  const normalized = normalizePhone(phone)
  const digitsOnly = normalized.replace(/\D/g, '')

  // Estratégia 1: Match exato
  let client = await prisma.client.findFirst({
    where: {
      OR: [
        { phone: normalized },
        { phone: digitsOnly },
        { phone: `+${digitsOnly}` },
      ],
    },
  })

  if (client) return client

  // Estratégia 2: Match por sufixo (últimos 8 dígitos)
  const suffix = digitsOnly.slice(-8)
  if (suffix.length === 8) {
    client = await prisma.client.findFirst({
      where: {
        phone: { endsWith: suffix },
      },
    })
  }

  return client
}

/**
 * Cria novo lead automaticamente
 */
async function createLeadFromWhatsApp(data: {
  phone: string
  name?: string
  email?: string
}) {
  const normalized = normalizePhone(data.phone)

  // Verificar se já existe cliente com esse telefone (recheck antes de criar)
  const existingClient = await findClientByPhone(normalized)
  if (existingClient) {
    console.log('[WhatsApp Webhook] Cliente já existe, retornando existente')
    return existingClient
  }

  // Pegar a primeira org disponível
  const firstOrg = await prisma.org.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (!firstOrg) {
    console.error('[WhatsApp Webhook] Nenhuma organização encontrada')
    return null
  }

  const timestamp = Date.now()

  // Se email foi fornecido (ex: do formulário), usar ele
  // Senão criar temporário único
  const email =
    data.email ||
    `whatsapp+${normalized.replace(/\D/g, '')}+${timestamp}@lead.temp`

  try {
    const client = await prisma.client.create({
      data: {
        name: data.name || `Lead WhatsApp ${normalized}`,
        phone: normalized,
        email: email,
        orgId: firstOrg.id,
        status: 'lead',
      },
    })

    console.log('[WhatsApp Webhook] Novo lead criado:', {
      clientId: client.id,
      name: client.name,
      phone: client.phone,
    })

    return client
  } catch (error: any) {
    // Se erro for de duplicação (unique constraint), tentar buscar novamente
    if (error?.code === 'P2002') {
      console.log(
        '[WhatsApp Webhook] Conflito de duplicação, buscando cliente existente'
      )
      return await findClientByPhone(normalized)
    }
    throw error
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  const raw = await req.text()

  console.log('[WhatsApp Webhook] Recebido')

  const body = JSON.parse(raw)
  const event = body?.event || 'message'
  const data = body.data || body

  // Ignorar eventos de lead_submission (esses vão para /api/leads)
  if (event === 'lead_submission' || data.event === 'lead_submission') {
    console.log('[WhatsApp Webhook] Lead submission ignorado (use /api/leads)')
    return NextResponse.json({
      received: true,
      note: 'Use /api/leads for lead submissions',
    })
  }

  console.log('[WhatsApp Webhook] Evento:', event)
  console.log(
    '[WhatsApp Webhook] Payload (primeiros 500 chars):',
    JSON.stringify(data, null, 2).substring(0, 500)
  )

  // Processar STATUS UPDATES (delivered, read, failed)
  if (event === 'status') {
    try {
      const messageId = data.messageId || data.id
      const status = data.status

      if (messageId && status) {
        await prisma.whatsAppMessage.updateMany({
          where: { messageId },
          data: {
            status,
            metadata: data,
          },
        })
        console.log(
          `[WhatsApp Webhook] Status atualizado: ${messageId} -> ${status}`
        )
      }

      return NextResponse.json({ received: true })
    } catch (error) {
      console.error('[WhatsApp Webhook] Erro ao atualizar status:', error)
      return NextResponse.json({ received: true })
    }
  }

  // Processar MENSAGENS
  try {
    const phoneNumber = data.from || data.recipient_id || data.recipientId
    let clientId: string | undefined
    let orgId: string | undefined

    // Buscar ou criar cliente automaticamente
    if (phoneNumber) {
      let client = await findClientByPhone(phoneNumber)

      if (client) {
        clientId = client.id
        orgId = client.orgId
        console.log('[WhatsApp Webhook] Cliente encontrado:', {
          clientId: client.id,
          clientName: client.name,
        })
      } else {
        // Criar novo lead automaticamente
        console.log('[WhatsApp Webhook] Criando novo lead para:', phoneNumber)
        client = await createLeadFromWhatsApp({
          phone: phoneNumber,
          name: data.name || data.profile?.name || data.customerName,
          email: data.email || data.customerEmail,
        })

        if (client) {
          clientId = client.id
          orgId = client.orgId
          console.log('[WhatsApp Webhook] Lead criado com sucesso!')
        }
      }
    }

    // Processar apenas mensagens reais do WhatsApp (texto, imagem, áudio, etc)
    const messageType = data.type || 'text'
    const messageText = data.text || data.body || data.message || null

    console.log('[WhatsApp Webhook] Mensagem processada:', {
      type: messageType,
      textLength: messageText?.length || 0,
      linkedToClient: !!clientId,
    })

    await prisma.whatsAppMessage.create({
      data: {
        messageId: data.id || data.messageId || `msg-${Date.now()}`,
        event: 'message',
        from: data.from,
        to: data.to,
        recipientId: data.recipient_id || data.recipientId,
        name: data.name || data.profile?.name,
        type: messageType,
        text: messageText,
        mediaUrl: data.media_url || data.mediaUrl,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        status: data.status || 'received',
        clientId,
        orgId,
        metadata: data,
      },
    })

    console.log('[WhatsApp Webhook] Mensagem salva com sucesso')
  } catch (error) {
    console.error('[WhatsApp Webhook] Erro ao salvar mensagem:', error)
  }

  return NextResponse.json({ received: true })
}
