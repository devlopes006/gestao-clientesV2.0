import { AuditAction, createAuditLog } from '@/lib/audit/trail'
import {
  extractMessages,
  extractStatusUpdates,
  MessageStatus,
  parseWebhookEvent,
  validateWebhookSignature,
} from '@/lib/whatsapp/client'
import { NextRequest, NextResponse } from 'next/server'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token'

/**
 * GET /api/webhooks/whatsapp
 * Webhook verification endpoint (used by WhatsApp to verify the webhook)
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
 * Webhook endpoint to receive WhatsApp messages and status updates
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // In production, validate signature
    const signature = request.headers.get('x-hub-signature-256') || ''
    const rawBody = JSON.stringify(body)

    // Note: Signature validation would require the raw body
    // For now, we'll skip it in development
    if (process.env.NODE_ENV === 'production') {
      if (!validateWebhookSignature(rawBody, signature, VERIFY_TOKEN)) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        )
      }
    }

    // Parse webhook event
    const event = parseWebhookEvent(body)

    // Extract messages
    const messages = extractMessages(event)
    console.log(`Received ${messages.length} message(s)`)

    // Process messages
    for (const message of messages) {
      console.log(`Message from ${message.from}: ${message.text}`)

      // Log to audit trail
      try {
        await createAuditLog({
          organizationId: 'default', // In production, get from context
          userId: `whatsapp_${message.from}`,
          action: AuditAction.USER_LOGIN, // Use appropriate action
          resourceType: 'whatsapp_message',
          resourceId: message.from,
          timestamp: new Date(parseInt(message.timestamp) * 1000),
          metadata: {
            messageType: message.type,
            text: message.text,
          },
        })
      } catch (error) {
        console.error('Failed to log WhatsApp message:', error)
      }

      // TODO: Process message based on type
      // - Could trigger automations
      // - Could route to specific agents
      // - Could update client status
    }

    // Extract status updates
    const statuses = extractStatusUpdates(event)
    console.log(`Received ${statuses.length} status update(s)`)

    // Process status updates
    for (const status of statuses) {
      console.log(`Message ${status.messageId} status: ${status.status}`)

      // Update message delivery status in database
      if (status.status === MessageStatus.DELIVERED) {
        console.log(`Message ${status.messageId} delivered`)
      } else if (status.status === MessageStatus.READ) {
        console.log(`Message ${status.messageId} read`)
      } else if (status.status === MessageStatus.FAILED) {
        console.error(`Message ${status.messageId} failed`)
      }

      // TODO: Update database with new status
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Still return 200 to avoid WhatsApp retries
    return NextResponse.json({ success: false })
  }
}
