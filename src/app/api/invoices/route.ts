import { cacheInvalidation } from '@/lib/cache'
import { getEmailNotificationService } from '@/lib/email-notifications'
import { prisma } from '@/lib/prisma'
import { invoiceListQuerySchema } from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { InvoiceService } from '@/services/financial'
import { InvoiceStatus } from '@prisma/client'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = invoiceListQuerySchema.safeParse({
      clientId: searchParams.get('clientId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      includeDeleted: searchParams.get('includeDeleted') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const q = parsed.data
    const filters = {
      orgId: profile.orgId,
      clientId: q.clientId || undefined,
      status: q.status as InvoiceStatus | undefined,
      dateFrom: q.dateFrom || undefined,
      dateTo: q.dateTo || undefined,
      includeDeleted: q.includeDeleted === 'true',
    }

    const pagination = {
      page: q.page ?? 1,
      limit: q.limit ?? 20,
    }

    const result = await InvoiceService.list(filters, pagination)

    return NextResponse.json({
      data: result.invoices,
      meta: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
        total: result.pagination.total,
      },
    })
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'invoices:list',
      level: 'error',
    })
    Sentry.captureException(error)
    console.error('Error listing invoices:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao listar faturas',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getSessionProfile()
    if (
      !profile ||
      profile.role !== 'OWNER' ||
      !profile.orgId ||
      !profile.user?.id
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const invoice = await InvoiceService.create({
      clientId: body.clientId,
      orgId: profile.orgId,
      dueDate: new Date(body.dueDate),
      items: body.items,
      discount: body.discount,
      tax: body.tax,
      notes: body.notes,
      internalNotes: body.internalNotes,
      installmentId: body.installmentId,
      createdBy: profile.user.id,
    })

    // Invalidate cache after invoice creation
    cacheInvalidation.invoices(profile.orgId)

    // Send email notification (async, don't await)
    try {
      const emailService = getEmailNotificationService()
      const client = await prisma.client.findUnique({
        where: { id: body.clientId },
        select: { name: true, email: true },
      })
      if (client?.email) {
        emailService
          .sendInvoiceCreatedEmail({
            invoiceNumber: invoice.number,
            clientName: client.name,
            clientEmail: client.email,
            dueDate: new Date(invoice.dueDate).toLocaleDateString('pt-BR'),
            amount:
              typeof invoice.total === 'object'
                ? invoice.total.toNumber()
                : invoice.total,
            currency: 'BRL',
            orgName: 'Gestão Clientes',
            invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`,
          })
          .catch((err: unknown) => {
            if (err instanceof Error) {
              console.error('Failed to send invoice email:', err.message)
              Sentry.captureException(err)
            }
          })
      }
    } catch (emailError) {
      console.error('Error sending invoice email:', emailError)
      if (emailError instanceof Error) {
        Sentry.captureException(emailError)
      }
      // Don't fail the request if email fails
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'invoices:create',
      level: 'error',
    })
    Sentry.captureException(error)
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao criar fatura',
      },
      { status: 400 }
    )
  }
}
