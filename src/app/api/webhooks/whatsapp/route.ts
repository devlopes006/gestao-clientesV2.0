import { NextRequest, NextResponse } from 'next/server'

/**
 * DEPRECADO - Use /api/integrations/whatsapp/webhook
 *
 * Este endpoint foi consolidado e movido para /api/integrations/whatsapp/webhook
 * para evitar duplicação de processamento de webhooks.
 *
 * Mantenha este arquivo apenas para não quebrar configurações antigas,
 * mas redirecione todo o tráfego para o novo endpoint.
 */

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token'

/**
 * GET /api/webhooks/whatsapp
 * Webhook verification endpoint (usado pelo WhatsApp para verificar o webhook)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return NextResponse.json(challenge)
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    console.error('Webhook verification error:', error)
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/webhooks/whatsapp
 * DEPRECADO - Redirecione para /api/integrations/whatsapp/webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.warn(
    '[DEPRECADO] Use /api/integrations/whatsapp/webhook ao invés deste endpoint'
  )

  // Retorna sucesso para não quebrar integrações antigas
  return NextResponse.json({
    received: true,
    warning:
      'Este endpoint está depreciado. Use /api/integrations/whatsapp/webhook',
  })
}
