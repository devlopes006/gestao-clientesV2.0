import { Resend } from 'resend'

/**
 * Email Notification Service using Resend
 */

export interface EmailNotificationPayload {
  to: string
  subject: string
  html: string
  replyTo?: string
  tags?: string[]
}

export interface InvoiceCreatedPayload {
  invoiceNumber: string
  clientName: string
  clientEmail: string
  dueDate: string
  amount: number
  currency: string
  orgName: string
  invoiceUrl: string
}

export interface InvoiceOverduePayload {
  invoiceNumber: string
  clientName: string
  clientEmail: string
  dueDate: string
  daysOverdue: number
  amount: number
  currency: string
  orgName: string
  invoiceUrl: string
}

export interface PaymentConfirmedPayload {
  invoiceNumber: string
  clientName: string
  clientEmail: string
  amount: number
  currency: string
  paidDate: string
  orgName: string
}

export interface ClientOverduePayload {
  clientName: string
  clientEmail: string
  contactEmail: string
  overdueCount: number
  totalOverdueAmount: number
  currency: string
  orgName: string
  dashboardUrl: string
}

export class EmailNotificationService {
  private resend: Resend
  private fromEmail: string
  private fromName: string

  constructor(apiKey?: string, fromEmail?: string, fromName?: string) {
    this.resend = new Resend(apiKey || process.env.RESEND_API_KEY || '')
    this.fromEmail =
      fromEmail ||
      process.env.RESEND_FROM_EMAIL ||
      'noreply@gestao-clientes.com'
    this.fromName = fromName || 'Gestão Clientes'
  }

  /**
   * Send generic email
   */
  async sendEmail(
    payload: EmailNotificationPayload
  ): Promise<{ id: string } | { error: string }> {
    try {
      const response = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        ...(payload.replyTo && { reply_to: payload.replyTo }),
        ...(payload.tags && { tags: payload.tags }),
      })

      // Type guard for response
      if (response && typeof response === 'object') {
        if ('error' in response && response.error) {
          const errorMsg =
            typeof response.error === 'object' && 'message' in response.error
              ? ((response.error as { message?: string }).message ??
                'Unknown error')
              : String(response.error)
          console.error(`Error sending email to ${payload.to}:`, errorMsg)
          return { error: errorMsg }
        }

        if ('id' in response) {
          return { id: String(response.id) }
        }
      }

      return { id: 'unknown' }
    } catch (error) {
      console.error(`Exception sending email to ${payload.to}:`, error)
      return {
        error: error instanceof Error ? error.message : 'Erro ao enviar email',
      }
    }
  }

  /**
   * Send invoice created notification
   */
  async sendInvoiceCreatedEmail(
    payload: InvoiceCreatedPayload
  ): Promise<{ id: string } | { error: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .invoice-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .amount { font-size: 20px; color: #667eea; font-weight: bold; }
          .footer { padding: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Nova Fatura</h1>
            <p>Você recebeu uma nova fatura</p>
          </div>
          <div class="content">
            <p>Olá <strong>${payload.clientName}</strong>,</p>
            <p>Uma nova fatura foi gerada em <strong>${payload.orgName}</strong>.</p>
            
            <div class="invoice-details">
              <div class="detail-row">
                <span class="detail-label">Número:</span>
                <span class="detail-value">${payload.invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Valor:</span>
                <span class="detail-value">${payload.currency} ${payload.amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vencimento:</span>
                <span class="detail-value">${payload.dueDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label" style="font-size: 18px;">Total:</span>
                <span class="amount">${payload.currency} ${payload.amount.toFixed(2)}</span>
              </div>
            </div>
            
            <p>Clique no link abaixo para visualizar e pagar a fatura:</p>
            <a href="${payload.invoiceUrl}" class="button">Ver Fatura →</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${payload.orgName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to: payload.clientEmail,
      subject: `Nova Fatura #${payload.invoiceNumber}`,
      html,
      tags: ['invoice', 'created'],
    })
  }

  /**
   * Send invoice overdue notification
   */
  async sendInvoiceOverdueEmail(
    payload: InvoiceOverduePayload
  ): Promise<{ id: string } | { error: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .invoice-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f5576c; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .amount { font-size: 20px; color: #f5576c; font-weight: bold; }
          .footer { padding: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Fatura Vencida</h1>
            <p>Ação necessária</p>
          </div>
          <div class="alert">
            <strong>Sua fatura está ${payload.daysOverdue} dias vencida!</strong> Por favor, regularize o pagamento o mais breve possível.
          </div>
          <div class="content">
            <p>Olá <strong>${payload.clientName}</strong>,</p>
            <p>Identificamos que você possui uma fatura vencida em nossa plataforma.</p>
            
            <div class="invoice-details">
              <div class="detail-row">
                <span class="detail-label">Número:</span>
                <span class="detail-value">${payload.invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Valor:</span>
                <span class="detail-value">${payload.currency} ${payload.amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vencimento:</span>
                <span class="detail-value">${payload.dueDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dias vencida:</span>
                <span class="detail-value" style="color: #f5576c; font-weight: bold;">${payload.daysOverdue} dias</span>
              </div>
            </div>
            
            <p>Por favor, regularize o pagamento. Clique no link abaixo para acessar a fatura:</p>
            <a href="${payload.invoiceUrl}" class="button">Pagar Fatura →</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${payload.orgName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to: payload.clientEmail,
      subject: `⚠️ Fatura Vencida #${payload.invoiceNumber}`,
      html,
      tags: ['invoice', 'overdue'],
    })
  }

  /**
   * Send payment confirmed notification
   */
  async sendPaymentConfirmedEmail(
    payload: PaymentConfirmedPayload
  ): Promise<{ id: string } | { error: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; color: #155724; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .invoice-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .amount { font-size: 20px; color: #28a745; font-weight: bold; }
          .footer { padding: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado</h1>
            <p>Obrigado!</p>
          </div>
          <div class="success">
            <strong>Seu pagamento foi confirmado com sucesso!</strong> Obrigado por manter sua conta em dia.
          </div>
          <div class="content">
            <p>Olá <strong>${payload.clientName}</strong>,</p>
            <p>Confirmamos o recebimento do seu pagamento.</p>
            
            <div class="invoice-details">
              <div class="detail-row">
                <span class="detail-label">Número:</span>
                <span class="detail-value">${payload.invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Valor:</span>
                <span class="detail-value">${payload.currency} ${payload.amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Data do Pagamento:</span>
                <span class="detail-value">${payload.paidDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label" style="font-size: 18px;">Total Pago:</span>
                <span class="amount">${payload.currency} ${payload.amount.toFixed(2)}</span>
              </div>
            </div>
            
            <p>Muito obrigado! Qualquer dúvida, entre em contato conosco.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${payload.orgName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to: payload.clientEmail,
      subject: `✅ Pagamento Confirmado #${payload.invoiceNumber}`,
      html,
      tags: ['payment', 'confirmed'],
    })
  }

  /**
   * Send client overdue notification (to staff)
   */
  async sendClientOverdueAlert(
    payload: ClientOverduePayload
  ): Promise<{ id: string } | { error: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; color: #721c24; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc3545; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .amount { font-size: 18px; color: #dc3545; font-weight: bold; }
          .footer { padding: 20px; text-align: center; color: #999; font-size: 12px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Alerta: Cliente Inadimplente</h1>
            <p>Ação recomendada</p>
          </div>
          <div class="alert">
            <strong>${payload.clientName}</strong> tem <strong>${payload.overdueCount} fatura(s) vencida(s)</strong> totalizando <strong>${payload.currency} ${payload.totalOverdueAmount.toFixed(2)}</strong>!
          </div>
          <div class="content">
            <p>Olá,</p>
            <p>O cliente ${payload.clientName} está com faturas em atraso e pode estar correndo risco de inadimplência.</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Cliente:</span>
                <span class="detail-value">${payload.clientName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${payload.clientEmail}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Faturas Vencidas:</span>
                <span class="detail-value" style="color: #dc3545; font-weight: bold;">${payload.overdueCount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total em Atraso:</span>
                <span class="amount">${payload.currency} ${payload.totalOverdueAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <p>Recomenda-se entrar em contato com o cliente para regularização do pagamento.</p>
            <a href="${payload.dashboardUrl}" class="button">Abrir Dashboard →</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${payload.orgName}. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to: payload.contactEmail,
      subject: `🚨 Alerta: ${payload.clientName} com Faturas Vencidas`,
      html,
      tags: ['client', 'overdue', 'alert'],
    })
  }
}

// Singleton instance
let emailService: EmailNotificationService | null = null

export function getEmailNotificationService(): EmailNotificationService {
  if (!emailService) {
    emailService = new EmailNotificationService()
  }
  return emailService
}
