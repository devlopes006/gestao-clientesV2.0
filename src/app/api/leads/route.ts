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

    // Buscar primeira org disponível
    const firstOrg = await prisma.org.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!firstOrg) {
      console.error('[Leads API] Nenhuma organização encontrada')
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 500 }
      )
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
          metadata: {
            ...(client.metadata as any),
            lastLeadCapture: new Date().toISOString(),
            plan: data.plan,
            bestTime: data.bestTime,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
            origin: data.origin,
          },
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
          metadata: {
            leadSource: 'landing_page',
            capturedAt: data.timestamp || new Date().toISOString(),
            plan: data.plan,
            bestTime: data.bestTime,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
            origin: data.origin,
          },
        },
      })

      console.log('[Leads API] Novo lead criado:', {
        clientId: client.id,
        name: client.name,
        phone: client.phone,
      })
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
