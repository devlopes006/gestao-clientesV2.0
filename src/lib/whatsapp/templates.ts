/**
 * WhatsApp Message Templates
 *
 * Pre-defined templates for common notifications
 */

import {
  formatPhoneNumber,
  sendTemplateMessage,
  sendTextMessage,
} from './client'

/**
 * Available notification templates
 */
export enum NotificationTemplate {
  INVOICE_CREATED = 'invoice_created',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_OVERDUE = 'invoice_overdue',
  PAYMENT_REMINDER = 'payment_reminder',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  MEETING_REMINDER = 'meeting_reminder',
}

/**
 * Template configuration
 */
interface TemplateConfig {
  templateName: string
  languageCode: string
  category: 'MARKETING' | 'OTP' | 'TRANSACTIONAL'
  description: string
}

/**
 * Template configurations
 */
const TEMPLATES: Record<NotificationTemplate, TemplateConfig> = {
  [NotificationTemplate.INVOICE_CREATED]: {
    templateName: 'invoice_created',
    languageCode: 'pt_BR',
    category: 'TRANSACTIONAL',
    description: 'Notificação de invoice criada',
  },
  [NotificationTemplate.INVOICE_PAID]: {
    templateName: 'invoice_paid',
    languageCode: 'pt_BR',
    category: 'TRANSACTIONAL',
    description: 'Notificação de invoice paga',
  },
  [NotificationTemplate.INVOICE_OVERDUE]: {
    templateName: 'invoice_overdue',
    languageCode: 'pt_BR',
    category: 'MARKETING',
    description: 'Notificação de invoice vencida',
  },
  [NotificationTemplate.PAYMENT_REMINDER]: {
    templateName: 'payment_reminder',
    languageCode: 'pt_BR',
    category: 'MARKETING',
    description: 'Lembrete de pagamento',
  },
  [NotificationTemplate.WELCOME]: {
    templateName: 'welcome',
    languageCode: 'pt_BR',
    category: 'MARKETING',
    description: 'Mensagem de boas-vindas',
  },
  [NotificationTemplate.PASSWORD_RESET]: {
    templateName: 'password_reset',
    languageCode: 'pt_BR',
    category: 'OTP',
    description: 'Redefinição de senha',
  },
  [NotificationTemplate.MEETING_REMINDER]: {
    templateName: 'meeting_reminder',
    languageCode: 'pt_BR',
    category: 'MARKETING',
    description: 'Lembrete de reunião',
  },
}

/**
 * Send invoice created notification
 */
export async function notifyInvoiceCreated(
  phoneNumber: string,
  invoiceNumber: string,
  clientName: string,
  amount: string,
  dueDate: string,
  phoneNumberId: string,
  accessToken: string
): Promise<{ messageId: string; status: string }> {
  try {
    const phone = formatPhoneNumber(phoneNumber)
    const config = TEMPLATES[NotificationTemplate.INVOICE_CREATED]

    const response = await sendTemplateMessage(
      phoneNumberId,
      phone,
      config.templateName,
      config.languageCode,
      [clientName, invoiceNumber, amount, dueDate],
      accessToken
    )

    return {
      messageId: response.messages[0].id,
      status: response.messages[0].message_status,
    }
  } catch (error) {
    console.error('Failed to send invoice created notification:', error)
    throw new Error('Failed to send WhatsApp notification')
  }
}

/**
 * Send invoice paid notification
 */
export async function notifyInvoicePaid(
  phoneNumber: string,
  invoiceNumber: string,
  amount: string,
  paymentDate: string,
  phoneNumberId: string,
  accessToken: string
): Promise<{ messageId: string; status: string }> {
  try {
    const phone = formatPhoneNumber(phoneNumber)
    const config = TEMPLATES[NotificationTemplate.INVOICE_PAID]

    const response = await sendTemplateMessage(
      phoneNumberId,
      phone,
      config.templateName,
      config.languageCode,
      [invoiceNumber, amount, paymentDate],
      accessToken
    )

    return {
      messageId: response.messages[0].id,
      status: response.messages[0].message_status,
    }
  } catch (error) {
    console.error('Failed to send invoice paid notification:', error)
    throw new Error('Failed to send WhatsApp notification')
  }
}

/**
 * Send payment reminder notification
 */
export async function notifyPaymentReminder(
  phoneNumber: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  phoneNumberId: string,
  accessToken: string
): Promise<{ messageId: string; status: string }> {
  try {
    const phone = formatPhoneNumber(phoneNumber)
    const config = TEMPLATES[NotificationTemplate.PAYMENT_REMINDER]

    const response = await sendTemplateMessage(
      phoneNumberId,
      phone,
      config.templateName,
      config.languageCode,
      [invoiceNumber, amount, dueDate],
      accessToken
    )

    return {
      messageId: response.messages[0].id,
      status: response.messages[0].message_status,
    }
  } catch (error) {
    console.error('Failed to send payment reminder notification:', error)
    throw new Error('Failed to send WhatsApp notification')
  }
}

/**
 * Send invoice overdue notification
 */
export async function notifyInvoiceOverdue(
  phoneNumber: string,
  invoiceNumber: string,
  amount: string,
  daysOverdue: number,
  phoneNumberId: string,
  accessToken: string
): Promise<{ messageId: string; status: string }> {
  try {
    const phone = formatPhoneNumber(phoneNumber)
    const config = TEMPLATES[NotificationTemplate.INVOICE_OVERDUE]

    const response = await sendTemplateMessage(
      phoneNumberId,
      phone,
      config.templateName,
      config.languageCode,
      [invoiceNumber, amount, String(daysOverdue)],
      accessToken
    )

    return {
      messageId: response.messages[0].id,
      status: response.messages[0].message_status,
    }
  } catch (error) {
    console.error('Failed to send invoice overdue notification:', error)
    throw new Error('Failed to send WhatsApp notification')
  }
}

/**
 * Send welcome message
 */
export async function notifyWelcome(
  phoneNumber: string,
  userName: string,
  phoneNumberId: string,
  accessToken: string
): Promise<{ messageId: string; status: string }> {
  try {
    const phone = formatPhoneNumber(phoneNumber)
    const config = TEMPLATES[NotificationTemplate.WELCOME]

    const response = await sendTemplateMessage(
      phoneNumberId,
      phone,
      config.templateName,
      config.languageCode,
      [userName],
      accessToken
    )

    return {
      messageId: response.messages[0].id,
      status: response.messages[0].message_status,
    }
  } catch (error) {
    console.error('Failed to send welcome notification:', error)
    throw new Error('Failed to send WhatsApp notification')
  }
}

/**
 * Send custom text message (fallback for when templates aren't available)
 */
export async function sendCustomMessage(
  phoneNumber: string,
  message: string,
  phoneNumberId: string,
  accessToken: string
): Promise<{ messageId: string; status: string }> {
  try {
    const phone = formatPhoneNumber(phoneNumber)

    const response = await sendTextMessage(
      phoneNumberId,
      phone,
      message,
      accessToken
    )

    return {
      messageId: response.messages[0].id,
      status: response.messages[0].message_status,
    }
  } catch (error) {
    console.error('Failed to send custom message:', error)
    throw new Error('Failed to send WhatsApp message')
  }
}

/**
 * Get template config
 */
export function getTemplateConfig(
  template: NotificationTemplate
): TemplateConfig {
  const config = TEMPLATES[template]
  if (!config) {
    throw new Error(`Unknown template: ${template}`)
  }
  return config
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): Array<{
  template: NotificationTemplate
  config: TemplateConfig
}> {
  return Object.entries(TEMPLATES).map(([template, config]) => ({
    template: template as NotificationTemplate,
    config,
  }))
}
