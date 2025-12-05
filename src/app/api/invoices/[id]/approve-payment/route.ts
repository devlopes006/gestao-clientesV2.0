import { cacheInvalidation } from '@/lib/cache'
import { getEmailNotificationService } from '@/lib/email-notifications'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { InvoiceService } from '@/services/financial'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const invoice = await InvoiceService.approvePayment(id, profile.orgId!, {
      paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
      notes: body.notes,
      createdBy: profile.user!.id,
    })

    // Invalidate cache after payment approval
    cacheInvalidation.invoices(profile.orgId!)

    // Send payment confirmation email (async, don't await)
    try {
      const emailService = getEmailNotificationService()
      const client = await prisma.client.findUnique({
        where: { id: invoice.clientId },
        select: { name: true, email: true },
      })
      if (client?.email) {
        emailService
          .sendPaymentConfirmedEmail({
            invoiceNumber: invoice.number,
            clientName: client.name,
            clientEmail: client.email,
            amount:
              typeof invoice.total === 'object'
                ? invoice.total.toNumber()
                : invoice.total,
            currency: 'BRL',
            paidDate: new Date(invoice.paidAt!).toLocaleDateString('pt-BR'),
            orgName: 'Gestão Clientes',
          })
          .catch((err: unknown) => {
            if (err instanceof Error) {
              console.error(
                'Failed to send payment confirmation email:',
                err.message
              )
              Sentry.captureException(err)
            }
          })
      }
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError)
      if (emailError instanceof Error) {
        Sentry.captureException(emailError)
      }
      // Don't fail the request if email fails
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error approving payment:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao aprovar pagamento',
      },
      { status: 400 }
    )
  }
}
