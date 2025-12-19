import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

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
 * Busca cliente pelo telefone
 */
async function findClientByPhone(phone: string) {
  const normalized = normalizePhone(phone)

  const phoneVariations = [normalized, normalized.replace('+', ''), phone]

  const client = await prisma.client.findFirst({
    where: {
      OR: phoneVariations.map((p) => ({ phone: { contains: p } })),
    },
  })

  return client
}

/**
 * Cria novo lead automaticamente
 */
async function createLeadFromWhatsApp(data: { phone: string; name?: string }) {
  const normalized = normalizePhone(data.phone)

  // Pegar a primeira org disponível
  const firstOrg = await prisma.org.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (!firstOrg) {
    console.error('[WhatsApp Webhook] Nenhuma organização encontrada')
    return null
  }

  const timestamp = Date.now()
  const tempEmail = `whatsapp+${normalized.replace(/\D/g, '')}+${timestamp}@lead.temp`

  const client = await prisma.client.create({
    data: {
      name: data.name || `Lead WhatsApp ${normalized}`,
      phone: normalized,
      email: tempEmail,
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
}

export async function POST(req: NextRequest) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  const raw = await req.text()

  console.log('[WhatsApp Webhook] Received request')
  console.log('[WhatsApp Webhook] Secret configured:', secret ? 'YES' : 'NO')
  console.log(
    '[WhatsApp Webhook] Headers:',
    Object.fromEntries(req.headers.entries())
  )

  // Se SECRET não estiver configurado, aceita sem verificação (modo de desenvolvimento)
  if (secret && secret !== 'sua-chave-compartilhada-hmac') {
    // Tenta ler header em diferentes cases
    const signature =
      req.headers.get('x-signature') || req.headers.get('X-Signature')
    console.log(
      '[WhatsApp Webhook] Signature received:',
      signature ? 'YES' : 'NO'
    )

    const ok = verifySignature(secret, raw, signature)
    if (!ok) {
      console.error('[WhatsApp Webhook] Invalid signature')
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }
    console.log('[WhatsApp Webhook] Signature valid ✅')
  } else {
    console.log(
      '[WhatsApp Webhook] No secret configured - accepting without verification'
    )
  }

  const body = JSON.parse(raw)

  console.log('[WhatsApp Webhook] Event:', body?.event, 'Data preview:', {
    id: body?.data?.id,
    from: body?.data?.from,
    text: body?.data?.text,
    timestamp: body?.data?.timestamp,
  })

  // Log completo para debugging
  console.log('[WhatsApp Webhook] Full payload:', JSON.stringify(body, null, 2))

  // Normalizar dados - aceita formato direto ou aninhado
  const data = body.data || body

  // Persistir no banco (Prisma) com criação automática de lead
  try {
    const phoneNumber = data.from || data.recipient_id || data.recipientId
    let clientId: string | undefined
    let orgId: string | undefined

    // Buscar ou criar cliente automaticamente
    if (phoneNumber && body?.event === 'message') {
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
          name: data.name || data.profile?.name,
        })

        if (client) {
          clientId = client.id
          orgId = client.orgId
          console.log('[WhatsApp Webhook] Lead criado com sucesso!')
        }
      }
    }

    await prisma.whatsAppMessage.create({
      data: {
        messageId: data.id || data.messageId,
        event: body.event || 'message',
        from: data.from,
        to: data.to,
        recipientId: data.recipient_id || data.recipientId,
        name: data.name || data.profile?.name,
        type: data.type || 'text',
        text: data.text,
        mediaUrl: data.media_url || data.mediaUrl,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        status: data.status,
        clientId,
        orgId,
        metadata: data,
      },
    })
    console.log('[WhatsApp Webhook] Message saved to database', {
      linkedToClient: !!clientId,
    })
  } catch (error) {
    console.error('[WhatsApp Webhook] Error saving message:', error)
    // Não falha o webhook, apenas loga o erro
  }

  return NextResponse.json({ received: true })
}
