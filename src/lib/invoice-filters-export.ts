import type { Prisma } from '@prisma/client'
import { z } from 'zod'

/**
 * Advanced Invoice Filters and Export Utilities
 */

// Filter schemas for advanced queries
export const invoiceFilterSchema = z.object({
  // Basic filters
  clientId: z.string().optional(),
  status: z.enum(['DRAFT', 'OPEN', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),

  // Date range filters
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),

  // Amount range filters
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),

  // Text search
  search: z.string().max(255).optional(),

  // Advanced filters
  includeDeleted: z.boolean().optional().default(false),
  clientStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  hasItems: z.boolean().optional(),
  overdueDays: z.number().min(0).optional(), // Filter invoices X+ days overdue

  // Sorting
  sortBy: z
    .enum(['dueDate', 'amount', 'issueDate', 'status'])
    .optional()
    .default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Pagination
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
})

export type InvoiceFilter = z.infer<typeof invoiceFilterSchema>

// CSV export schema
export const csvExportOptionsSchema = z.object({
  format: z.enum(['csv', 'excel']).optional().default('csv'),
  includeInvoiceItems: z.boolean().optional().default(true),
  dateFormat: z
    .enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
    .optional()
    .default('DD/MM/YYYY'),
  includeNotes: z.boolean().optional().default(false),
})

export type CsvExportOptions = z.infer<typeof csvExportOptionsSchema>

/**
 * Build Prisma where clause from filters
 */
export function buildInvoiceWhereClause(
  filter: InvoiceFilter,
  orgId: string
): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = {
    orgId,
  }

  if (filter.clientId) {
    where.clientId = filter.clientId
  }

  if (filter.status) {
    where.status = filter.status
  }

  // Date range
  if (filter.dateFrom || filter.dateTo) {
    where.dueDate = {}
    if (filter.dateFrom) {
      where.dueDate.gte = new Date(filter.dateFrom)
    }
    if (filter.dateTo) {
      where.dueDate.lte = new Date(filter.dateTo)
    }
  }

  // Amount range
  if (filter.amountMin !== undefined || filter.amountMax !== undefined) {
    where.total = {}
    if (filter.amountMin !== undefined) {
      where.total.gte = filter.amountMin
    }
    if (filter.amountMax !== undefined) {
      where.total.lte = filter.amountMax
    }
  }

  // Text search
  if (filter.search) {
    where.OR = [
      {
        number: {
          contains: filter.search,
          mode: 'insensitive',
        },
      },
      {
        client: {
          name: {
            contains: filter.search,
            mode: 'insensitive',
          },
        },
      },
      {
        notes: {
          contains: filter.search,
          mode: 'insensitive',
        },
      },
    ]
  }

  // Overdue days filter
  if (filter.overdueDays !== undefined) {
    const overdueBefore = new Date()
    overdueBefore.setDate(overdueBefore.getDate() - filter.overdueDays)
    where.AND = [
      {
        status: 'OPEN',
      },
      {
        dueDate: {
          lt: overdueBefore,
        },
      },
    ]
  }

  // Client status filter
  if (filter.clientStatus) {
    where.client = {
      status: filter.clientStatus,
    }
  }

  return where
}

/**
 * Build Prisma orderBy
 */
export function buildInvoiceOrderBy(
  filter: InvoiceFilter
): Prisma.InvoiceOrderByWithRelationInput {
  const orderByMap: Record<string, Prisma.InvoiceOrderByWithRelationInput> = {
    dueDate: { dueDate: filter.sortOrder },
    amount: { total: filter.sortOrder },
    issueDate: { issueDate: filter.sortOrder },
    status: { status: filter.sortOrder },
  }

  return orderByMap[filter.sortBy] || { dueDate: 'desc' }
}

/**
 * Format date for CSV output
 */
export function formatCsvDate(
  date: Date | string | undefined,
  format: string
): string {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`
  }
}

/**
 * Format currency for CSV
 */
export function formatCsvCurrency(value: number | undefined): string {
  if (!value) return '0,00'
  return value.toFixed(2).replace('.', ',')
}

/**
 * Escape CSV field value
 */
export function escapeCsvField(value: string | null | undefined): string {
  if (!value) return '""'
  const escaped = String(value).replace(/"/g, '""')
  return `"${escaped}"`
}

/**
 * Generate CSV header row
 */
export function generateCsvHeader(includeItems: boolean): string[] {
  const headers = [
    'Número da Fatura',
    'Cliente',
    'Email',
    'Status',
    'Data de Emissão',
    'Vencimento',
    'Subtotal',
    'Desconto',
    'Imposto',
    'Total',
  ]

  if (includeItems) {
    headers.push('Itens')
  }

  return headers
}

/**
 * Invoice type for CSV export
 */
interface InvoiceData {
  number: string
  client?: { name?: string; email?: string }
  status: string
  issueDate?: Date | string
  dueDate?: Date | string
  subtotal?: number
  discount?: number
  tax?: number
  total?: number
  items?: InvoiceItemData[]
}

interface InvoiceItemData {
  description: string
  quantity: number
  unitAmount: number
}

/**
 * Generate CSV data rows from invoices
 */
export function generateCsvRows(
  invoices: InvoiceData[],
  options: CsvExportOptions
): string[][] {
  const rows: string[][] = []

  for (const invoice of invoices) {
    const row: string[] = [
      escapeCsvField(invoice.number),
      escapeCsvField(invoice.client?.name),
      escapeCsvField(invoice.client?.email),
      escapeCsvField(invoice.status),
      formatCsvDate(invoice.issueDate, options.dateFormat),
      formatCsvDate(invoice.dueDate, options.dateFormat),
      formatCsvCurrency(invoice.subtotal),
      formatCsvCurrency(invoice.discount),
      formatCsvCurrency(invoice.tax),
      formatCsvCurrency(invoice.total),
    ]

    if (options.includeInvoiceItems && invoice.items?.length) {
      const itemsStr = invoice.items
        .map(
          (item: InvoiceItemData) =>
            `${item.description} (${item.quantity}x ${formatCsvCurrency(item.unitAmount)})`
        )
        .join('; ')
      row.push(escapeCsvField(itemsStr))
    }

    rows.push(row)
  }

  return rows
}

/**
 * Convert CSV rows to string
 */
export function convertCsvToString(
  headers: string[],
  rows: string[][]
): string {
  const lines: string[] = []

  // Add headers
  lines.push(headers.map(escapeCsvField).join(','))

  // Add data rows
  for (const row of rows) {
    lines.push(row.join(','))
  }

  return lines.join('\n')
}

/**
 * Generate complete CSV from invoices
 */
export function generateInvoicesCsv(
  invoices: InvoiceData[],
  options: CsvExportOptions
): string {
  const headers = generateCsvHeader(options.includeInvoiceItems)
  const rows = generateCsvRows(invoices, options)
  return convertCsvToString(headers, rows)
}

/**
 * Generate CSV filename with timestamp
 */
export function generateCsvFilename(prefix: string = 'invoices'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('Z')[0]
  return `${prefix}_${timestamp}.csv`
}

/**
 * Parse filter from query params
 */
export function parseInvoiceFilters(
  searchParams: URLSearchParams
): InvoiceFilter {
  const parsed = {
    clientId: searchParams.get('clientId') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    amountMin: searchParams.get('amountMin')
      ? parseFloat(searchParams.get('amountMin')!)
      : undefined,
    amountMax: searchParams.get('amountMax')
      ? parseFloat(searchParams.get('amountMax')!)
      : undefined,
    search: searchParams.get('search') ?? undefined,
    clientStatus: searchParams.get('clientStatus') ?? undefined,
    overdueDays: searchParams.get('overdueDays')
      ? parseInt(searchParams.get('overdueDays')!)
      : undefined,
    sortBy: searchParams.get('sortBy') ?? 'dueDate',
    sortOrder: searchParams.get('sortOrder') ?? 'desc',
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    limit: searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 20,
    includeDeleted: searchParams.get('includeDeleted') === 'true',
  }

  return invoiceFilterSchema.parse(parsed)
}
