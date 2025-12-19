import { NextRequest, NextResponse } from 'next/server'

/**
 * Envia mensagem WhatsApp via Landing Page
 *
 * A Landing Page tem as credenciais do Meta Cloud API,
 * então ela é quem realmente envia as mensagens.
 *
 * Este endpoint é um proxy para /api/messages/send da LP.
 */
export async function POST(req: NextRequest) {
  try {
    const { to, body, templateName, templateParams } = await req.json()

    if (!to) {
      return NextResponse.json(
        { error: 'Número de telefone é obrigatório' },
        { status: 400 }
      )
    }

    if (!body && !templateName) {
      return NextResponse.json(
        { error: 'Mensagem ou template é obrigatório' },
        { status: 400 }
      )
    }

    const lpGateway = process.env.NEXT_PUBLIC_MESSAGES_GATEWAY
    if (!lpGateway) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_MESSAGES_GATEWAY não configurado' },
        { status: 500 }
      )
    }

    // Chamar API da Landing Page
    const response = await fetch(`${lpGateway}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        body,
        templateName,
        templateParams,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Send Message] Erro da LP:', data)
      return NextResponse.json(
        { error: data.error || 'Falha ao enviar mensagem' },
        { status: response.status }
      )
    }

    console.log('[Send Message] Mensagem enviada:', {
      to,
      messageId: data.messageId,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Send Message] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno ao enviar mensagem' },
      { status: 500 }
    )
  }
}
