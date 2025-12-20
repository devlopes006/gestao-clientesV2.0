import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 0

/**
 * Retry helper com exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i)
        console.log(
          `[Retry] Tentativa ${i + 1} falhou, aguardando ${delay}ms...`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Envia mensagem WhatsApp via Landing Page
 *
 * A Landing Page tem as credenciais do Meta Cloud API,
 * então ela é quem realmente envia as mensagens.
 *
 * Este endpoint é um proxy para /api/messages/send da LP.
 * Também salva a mensagem no banco de dados da Gestão.
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

    const normalizedPhone = to.replace(/\D/g, '')
    const messageId = `sent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    // Salvar mensagem como 'sending' antes de enviar
    try {
      await prisma.whatsAppMessage.create({
        data: {
          messageId,
          from: 'admin',
          to: normalizedPhone,
          type: templateName ? 'template' : 'text',
          text: body || `[Template: ${templateName}]`,
          timestamp: new Date(),
          event: 'message',
          status: 'sending',
          metadata: templateName ? { templateName, templateParams } : undefined,
        },
      })
    } catch (dbError) {
      console.error('[Send Message] Erro ao salvar (sending):', dbError)
    }

    // Enviar com retry
    let data: any
    try {
      data = await retry(
        async () => {
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

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Falha ao enviar mensagem')
          }

          return result
        },
        3,
        1000
      )

      console.log('[Send Message] Mensagem enviada:', {
        to,
        messageId: data.messageId,
      })
    } catch (error) {
      // Atualizar status para 'failed'
      try {
        await prisma.whatsAppMessage.updateMany({
          where: { messageId },
          data: { status: 'failed' },
        })
      } catch (updateError) {
        console.error(
          '[Send Message] Erro ao atualizar status failed:',
          updateError
        )
      }

      const err = error as Error
      return NextResponse.json(
        { error: err.message || 'Falha ao enviar mensagem' },
        { status: 500 }
      )
    }

    // Atualizar mensagem com messageId real e status 'sent'
    try {
      await prisma.whatsAppMessage.updateMany({
        where: { messageId },
        data: {
          messageId: data.messageId || messageId,
          status: 'sent',
        },
      })

      console.log('[Send Message] Status atualizado para sent:', {
        messageId: data.messageId,
      })
    } catch (dbError) {
      console.error('[Send Message] Erro ao atualizar status:', dbError)
    }

    return NextResponse.json({
      ...data,
      messageId: data.messageId || messageId,
    })
  } catch (error) {
    console.error('[Send Message] Error:', error)
    return NextResponse.json(
      { error: 'Erro interno ao enviar mensagem' },
      { status: 500 }
    )
  }
}
