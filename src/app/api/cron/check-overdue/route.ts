
import { getEmailNotificationService } from '@/lib/email-notifications'
import { prisma } from '@/lib/prisma'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

/**
 * Cron job to check and send overdue invoice notifications
 * Should be called once per day
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const emailService = getEmailNotificationService()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find invoices that are overdue (OPEN status and dueDate in past)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'OPEN',
        dueDate: {
          lt: today,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        org: {
          select: {
            name: true,
          },
        },
      },
    })

    let sentCount = 0
    let failedCount = 0

    for (const invoice of overdueInvoices) {
      try {
        if (!invoice.client.email) {
          console.warn(`Invoice ${invoice.number}: Client has no email`)
          continue
        }

        const daysOverdue = Math.floor(
          (today.getTime() - new Date(invoice.dueDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )

        // Only send if 1+ days overdue (avoid duplicate daily emails)
        if (daysOverdue >= 1 && daysOverdue % 7 === 1) {
          // Send every 7 days after first overdue
          const result = await emailService.sendInvoiceOverdueEmail({
            invoiceNumber: invoice.number,
            clientName: invoice.client.name,
            clientEmail: invoice.client.email,
            dueDate: new Date(invoice.dueDate).toLocaleDateString('pt-BR'),
            daysOverdue,
            amount: invoice.total,
            currency: 'BRL',
            orgName: invoice.org?.name || 'Gestão Clientes',
            invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`,
          })

          if ('error' in result) {
            failedCount++
            Sentry.captureException(
              new Error(
                `Failed to send overdue email for ${invoice.number}: ${result.error}`
              )
            )
          } else {
            sentCount++
          }
        }
      } catch (error) {
        failedCount++
        console.error(`Error processing invoice ${invoice.number}:`, error)
        Sentry.captureException(error)
      }
    }

    // Also check for clients with multiple overdue invoices
    const clientsWithOverdueInvoices = await prisma.invoice.groupBy({
      by: ['clientId', 'orgId'],
      where: {
        status: 'OPEN',
        dueDate: {
          lt: today,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    })

    for (const group of clientsWithOverdueInvoices) {
      try {
        if (group._count && group._count.id >= 2) {
          // Only alert if 2+ overdue invoices
          const client = await prisma.client.findUnique({
            where: { id: group.clientId },
            select: {
              id: true,
              name: true,
              email: true,
              orgId: true,
            },
          })

          if (client?.email) {
            // Get org details
            const org = await prisma.org.findUnique({
              where: { id: client.orgId },
              select: {
                name: true,
              },
            })

            const result = await emailService.sendClientOverdueAlert({
              clientName: client.name,
              clientEmail: client.email,
              contactEmail:
                process.env.SUPPORT_EMAIL || 'support@gestao-clientes.com',
              overdueCount: group._count.id,
              totalOverdueAmount: group._sum?.total || 0,
              currency: 'BRL',
              orgName: org?.name || 'Gestão Clientes',
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            })

            if ('error' in result) {
              failedCount++
              Sentry.captureException(
                new Error(
                  `Failed to send client overdue alert for ${client.name}: ${result.error}`
                )
              )
            } else {
              sentCount++
            }
          }
        }
      } catch (error) {
        failedCount++
        console.error(`Error processing client overdue alerts:`, error)
        Sentry.captureException(error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed overdue invoices: ${sentCount} emails sent, ${failedCount} failed`,
      overdueInvoicesFound: overdueInvoices.length,
      emailsSent: sentCount,
      emailsFailed: failedCount,
    })
  } catch (error) {
    console.error('Error in overdue invoice cron job:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      {
        error: 'Erro ao processar faturas vencidas',
      },
      { status: 500 }
    )
  }
}
