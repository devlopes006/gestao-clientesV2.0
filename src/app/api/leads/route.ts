import { authenticateRequest } from '@/infrastructure/http/middlewares/auth.middleware'
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
 * Cria mensagem de boas-vindas para o lead no WhatsApp
 */
async function createWelcomeMessage(client: any, orgId: string, leadData: any) {
  try {
    const firstName = client.name?.split(' ')[0] || 'visitante'
    const planText = leadData.plan || 'Não especificado'
    const emailText = client.email || 'Não informado'
    const phoneDisplay = client.phone?.replace(/\+55/, '55 ') || 'Não informado'

    // Mensagem de boas-vindas igual à enviada no WhatsApp
    const welcomeText = `Olá ${client.name}! 👋

Recebemos seu interesse no Método Gestão Extrema da Esther Social Media!

📋 Seus dados:
• E-mail: ${emailText}
• Plano: ${planText}
• WhatsApp: ${phoneDisplay}

✅ Próximos passos:
Nossa equipe entrará em contato em breve para agendar uma conversa inicial e explicar tudo sobre o programa.

🚀 Prepare-se para transformar seu Instagram em uma máquina de autoridade!

Esta é uma mensagem automática de confirmação.

Esther Social Media © 2025`

    // Criar mensagem no banco (simula recebimento no WhatsApp)
    await prisma.whatsAppMessage.create({
      data: {
        event: 'message',
        from: 'system',
        to: client.phone,
        recipientId: client.phone,
        name: client.name,
        type: 'text',
        text: welcomeText,
        timestamp: new Date(),
        status: 'sent',
        isRead: false,
        orgId,
        clientId: client.id,
        metadata: {
          source: 'landing_page_welcome',
          leadData: {
            plan: leadData.plan,
            bestTime: leadData.bestTime,
            origin: leadData.origin,
          },
        },
      },
    })

    console.log(
      '[Leads API] ✅ Mensagem de boas-vindas criada para:',
      client.name
    )
  } catch (error) {
    console.error('[Leads API] Erro ao criar mensagem de boas-vindas:', error)
    // Não falha a criação do lead se mensagem falhar
  }
}

/**
 * GET /api/leads
 * Lista todos os leads da organização do usuário autenticado
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req, {
      rateLimit: true,
      requireOrg: true,
    })

    if ('error' in authResult) {
      return authResult.error
    }

    const { orgId } = authResult.context

    const leads = await prisma.client.findMany({
      where: {
        orgId,
        status: 'lead',
        deletedAt: null, // Não mostrar leads deletados
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, leads })
  } catch (error) {
    console.error('[Leads API] Erro ao listar leads:', error)
    return NextResponse.json(
      {
        error: 'Failed to list leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/leads
 * Recebe leads capturados da Landing Page
 *
 * Payload esperado:
 * {
 *   name: string
 *   email: string
 *   phone: string
 *   plan?: string
 *   bestTime?: string
 *   utmSource?: string
 *   utmMedium?: string
 *   utmCampaign?: string
 *   origin?: string
 *   timestamp?: string
 * }
 */
export async function POST(req: NextRequest) {
  console.log('[Leads API] ===== Nova requisição recebida =====')
  console.log('[Leads API] URL:', req.url)
  console.log('[Leads API] Method:', req.method)
  console.log('[Leads API] Headers:', Object.fromEntries(req.headers.entries()))

  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  const raw = await req.text()
  const signature =
    req.headers.get('x-signature') || req.headers.get('x-webhook-signature')

  console.log('[Leads API] Secret configurado:', !!secret)
  console.log('[Leads API] Signature recebida:', signature)
  console.log('[Leads API] Payload raw:', raw.substring(0, 200))

  // Verificar assinatura se configurada
  if (secret && signature) {
    // Remove o prefixo 'sha256=' se existir
    const cleanSignature = signature.replace('sha256=', '')
    if (!verifySignature(secret, raw, cleanSignature)) {
      console.error('[Leads API] ❌ Assinatura inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    console.log('[Leads API] ✅ Assinatura válida')
  } else if (secret && !signature) {
    console.error(
      '[Leads API] ❌ Secret configurado mas signature não recebida'
    )
    return NextResponse.json({ error: 'Signature required' }, { status: 401 })
  } else {
    console.log(
      '[Leads API] ⚠️  Signature não configurada - aceitando requisição'
    )
  }

  try {
    const data = JSON.parse(raw)

    console.log('[Leads API] Lead recebido:', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      origin: data.origin,
    })

    // Normalizar telefone
    let normalizedPhone = data.phone?.replace(/\D/g, '') || ''
    if (normalizedPhone && !normalizedPhone.startsWith('55')) {
      normalizedPhone = `55${normalizedPhone}`
    }
    if (normalizedPhone) {
      normalizedPhone = `+${normalizedPhone}`
    }

    // Buscar primeira org disponível ou criar uma padrão
    let firstOrg = await prisma.org.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!firstOrg) {
      console.log(
        '[Leads API] ⚠️  Nenhuma organização encontrada - criando org padrão'
      )
      firstOrg = await prisma.org.create({
        data: {
          name: 'Organização Padrão',
          slug: 'organizacao-padrao',
          plan: 'free',
          settings: {
            createdAutomatically: true,
            createdAt: new Date().toISOString(),
          },
        },
      })
      console.log('[Leads API] ✅ Org padrão criada:', firstOrg.id)
    }

    // Verificar se cliente já existe
    let client = await prisma.client.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: normalizedPhone }],
      },
    })

    if (client) {
      // Atualizar cliente existente
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          name: data.name || client.name,
          email: data.email || client.email,
          phone: normalizedPhone || client.phone,
          status: client.status === 'inactive' ? 'lead' : client.status,
          // Não temos campo metadata - informações do UTM são descartadas
        },
      })

      console.log('[Leads API] Cliente atualizado:', {
        clientId: client.id,
        name: client.name,
      })
    } else {
      // Criar novo cliente
      client = await prisma.client.create({
        data: {
          name: data.name || 'Lead sem nome',
          email: data.email || `lead-${Date.now()}@temp.temp`,
          phone: normalizedPhone,
          orgId: firstOrg.id,
          status: 'lead',
          // Não temos campo metadata - informações do UTM são descartadas
        },
      })

      console.log('[Leads API] Novo lead criado:', {
        clientId: client.id,
        name: client.name,
        phone: client.phone,
      })

      // Criar mensagem de boas-vindas apenas para novos leads
      await createWelcomeMessage(client, firstOrg.id, data)
    }

    return NextResponse.json({
      success: true,
      clientId: client.id,
      action:
        client.createdAt.getTime() > Date.now() - 5000 ? 'created' : 'updated',
    })
  } catch (error) {
    console.error('[Leads API] Erro ao processar lead:', error)
    return NextResponse.json(
      {
        error: 'Failed to process lead',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
