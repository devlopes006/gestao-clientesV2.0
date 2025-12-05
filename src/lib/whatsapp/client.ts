/**
 * WhatsApp Business API Integration
 *
 * Handles all WhatsApp communications including messages, templates, and webhooks
 */

/**
 * WhatsApp message types
 */
export enum WhatsAppMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  TEMPLATE = 'template',
}

/**
 * WhatsApp template categories
 */
export enum TemplateCategory {
  MARKETING = 'MARKETING',
  OTP = 'OTP',
  TRANSACTIONAL = 'TRANSACTIONAL',
}

/**
 * WhatsApp message status
 */
export enum MessageStatus {
  ACCEPTED = 'accepted',
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * WhatsApp request interface
 */
export interface WhatsAppRequest {
  messaging_product: 'whatsapp'
  recipient_type: 'individual' | 'group'
  to: string // Phone number with country code
  type: WhatsAppMessageType
  message?: WhatsAppMessage
}

/**
 * WhatsApp message interface
 */
export interface WhatsAppMessage {
  preview_url?: boolean
  body?: string // For text
  link?: string // For image/video/document
  caption?: string // For media
  filename?: string // For document
  template?: {
    name: string
    language: {
      code: string // e.g., pt_BR
    }
    parameters?: {
      body?: {
        parameters: Array<{ type: string; text?: string }>
      }
    }
  }
}

/**
 * WhatsApp webhook event
 */
export interface WhatsAppWebhookEvent {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: {
            name: string
          }
          wa_id: string
        }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: {
            body: string
          }
          image?: {
            id: string
            mime_type: string
          }
          document?: {
            id: string
            mime_type: string
            filename: string
          }
        }>
        statuses?: Array<{
          id: string
          status: MessageStatus
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

/**
 * WhatsApp API response
 */
export interface WhatsAppApiResponse {
  messages: Array<{
    id: string
    message_status: MessageStatus
  }>
  contacts?: Array<{
    input: string
    wa_id: string
  }>
}

/**
 * WhatsApp template definition
 */
export interface WhatsAppTemplate {
  id: string
  name: string
  category: TemplateCategory
  language: string // pt_BR, en_US, etc
  status: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED'
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    text?: string
    format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO'
    parameters?: string[]
    buttons?: Array<{
      type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY'
      text: string
      url?: string
      phone_number?: string
    }>
  }>
}

/**
 * Send a text message via WhatsApp
 */
export async function sendTextMessage(
  phoneNumberId: string,
  toPhoneNumber: string,
  message: string,
  accessToken: string
): Promise<WhatsAppApiResponse> {
  const url = `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`

  const payload: WhatsAppRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhoneNumber,
    type: WhatsAppMessageType.TEXT,
    message: {
      preview_url: true,
      body: message,
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to send WhatsApp text message:', error)
    throw new Error('Failed to send WhatsApp message')
  }
}

/**
 * Send a template message via WhatsApp
 */
export async function sendTemplateMessage(
  phoneNumberId: string,
  toPhoneNumber: string,
  templateName: string,
  languageCode: string,
  parameters: string[],
  accessToken: string
): Promise<WhatsAppApiResponse> {
  const url = `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`

  const payload: WhatsAppRequest = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhoneNumber,
    type: WhatsAppMessageType.TEMPLATE,
    message: {
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        parameters: {
          body: {
            parameters: parameters.map((param) => ({
              type: 'text',
              text: param,
            })),
          },
        },
      },
    },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to send WhatsApp template message:', error)
    throw new Error('Failed to send template message')
  }
}

/**
 * Validate webhook signature from WhatsApp
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  verifyToken: string
): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha256', verifyToken)
    .update(body)
    .digest('hex')

  return hash === signature
}

/**
 * Parse incoming webhook event
 */
export function parseWebhookEvent(
  body: Record<string, unknown>
): WhatsAppWebhookEvent {
  // Validate required fields for WhatsApp webhook
  if (typeof body === 'object' && body !== null) {
    const parsed = body as unknown as WhatsAppWebhookEvent
    if ('object' in body && 'entry' in body) {
      return parsed
    }
  }
  throw new Error('Invalid webhook payload structure')
}

/**
 * Extract messages from webhook event
 */
export function extractMessages(event: WhatsAppWebhookEvent): Array<{
  from: string
  text?: string
  type: string
  timestamp: string
}> {
  const messages: Array<{
    from: string
    text?: string
    type: string
    timestamp: string
  }> = []

  event.entry.forEach((entry) => {
    entry.changes.forEach((change) => {
      if (change.value.messages) {
        change.value.messages.forEach((msg) => {
          messages.push({
            from: msg.from,
            text: msg.text?.body,
            type: msg.type,
            timestamp: msg.timestamp,
          })
        })
      }
    })
  })

  return messages
}

/**
 * Extract status updates from webhook event
 */
export function extractStatusUpdates(event: WhatsAppWebhookEvent): Array<{
  messageId: string
  status: MessageStatus
  recipientId: string
  timestamp: string
}> {
  const statuses: Array<{
    messageId: string
    status: MessageStatus
    recipientId: string
    timestamp: string
  }> = []

  event.entry.forEach((entry) => {
    entry.changes.forEach((change) => {
      if (change.value.statuses) {
        change.value.statuses.forEach((status) => {
          statuses.push({
            messageId: status.id,
            status: status.status as MessageStatus,
            recipientId: status.recipient_id,
            timestamp: status.timestamp,
          })
        })
      }
    })
  })

  return statuses
}

/**
 * Format phone number to WhatsApp format
 */
export function formatPhoneNumber(
  phone: string,
  countryCode: string = '55'
): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Add country code if not present
  if (!cleaned.startsWith(countryCode)) {
    return countryCode + cleaned
  }

  return cleaned
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Should be at least 10 digits, at most 15
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

/**
 * Get message status label in Portuguese
 */
export function getStatusLabel(status: MessageStatus): string {
  const labels: Record<MessageStatus, string> = {
    [MessageStatus.ACCEPTED]: 'Aceita',
    [MessageStatus.PENDING]: 'Pendente',
    [MessageStatus.SENT]: 'Enviada',
    [MessageStatus.DELIVERED]: 'Entregue',
    [MessageStatus.READ]: 'Lida',
    [MessageStatus.FAILED]: 'Falhou',
  }

  return labels[status] || 'Desconhecido'
}

/**
 * Get message type label in Portuguese
 */
export function getMessageTypeLabel(type: WhatsAppMessageType): string {
  const labels: Record<WhatsAppMessageType, string> = {
    [WhatsAppMessageType.TEXT]: 'Texto',
    [WhatsAppMessageType.IMAGE]: 'Imagem',
    [WhatsAppMessageType.DOCUMENT]: 'Documento',
    [WhatsAppMessageType.AUDIO]: 'Áudio',
    [WhatsAppMessageType.VIDEO]: 'Vídeo',
    [WhatsAppMessageType.TEMPLATE]: 'Template',
  }

  return labels[type] || 'Desconhecido'
}
