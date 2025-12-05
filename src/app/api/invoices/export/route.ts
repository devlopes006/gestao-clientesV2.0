import { ApiResponseHandler } from '@/lib/api-response'
import {
  buildInvoiceOrderBy,
  buildInvoiceWhereClause,
  csvExportOptionsSchema,
  generateCsvFilename,
  generateInvoicesCsv,
  parseInvoiceFilters,
} from '@/lib/invoice-filters-export'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

/**
 * GET /api/invoices/export
 * Export invoices as CSV with advanced filtering and formatting
 */
export async function GET(request: Request) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return ApiResponseHandler.unauthorized()
    }

    const { searchParams } = new URL(request.url)

    // Parse filters
    const filters = parseInvoiceFilters(searchParams)

    // Parse export options
    const exportOptions = csvExportOptionsSchema.parse({
      format: searchParams.get('format') ?? undefined,
      includeInvoiceItems: searchParams.get('includeInvoiceItems') !== 'false',
      dateFormat: searchParams.get('dateFormat') ?? undefined,
      includeNotes: searchParams.get('includeNotes') === 'true',
    })

    // Build where clause
    const where = buildInvoiceWhereClause(filters, profile.orgId)
    const orderBy = buildInvoiceOrderBy(filters)

    // Fetch invoices with items
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy,
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        items: true,
      },
    })

    if (invoices.length === 0) {
      return new NextResponse('', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${generateCsvFilename('invoices-export')}.csv"`,
        },
      })
    }

    // Generate CSV
    const csv = generateInvoicesCsv(invoices, exportOptions)
    const fileName = generateCsvFilename('invoices-export')

    // Return CSV
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}.csv"`,
        'X-Total-Records': String(invoices.length),
      },
    })
  } catch (error) {
    console.error('Error exporting invoices:', error)
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'invoices:export',
      level: 'error',
    })
    Sentry.captureException(error)

    if (error instanceof Error && error.message.includes('Validation')) {
      return ApiResponseHandler.validationError(error.message)
    }

    return ApiResponseHandler.serverError('Erro ao exportar faturas')
  }
}
