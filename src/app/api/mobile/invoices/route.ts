import {
  buildPaginatedResponse,
  getPrismaSkipTake,
  normalizePaginationParams,
  toMobileInvoice,
} from '@/lib/mobile/optimization'
import { prisma } from '@/lib/prisma'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { getAuthContext } from '@/middleware/auth'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/mobile/invoices
 *
 * Lightweight invoices endpoint for mobile apps
 * Response ~35% smaller than full invoice response
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: string (optional, e.g., 'PENDING', 'PAID')
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const id = getIdentifier(request as unknown as Request)
    const rl = await checkRateLimit(id, apiRatelimit)
    if (!rl.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetAt: rl.reset.toISOString(),
        },
        { status: 429 }
      )
    }

    const { orgId: organizationId } = getAuthContext(request)
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page') || '1')
      : 1
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit') || '20')
      : 20
    const status = searchParams.get('status') || ''
    const cursor = searchParams.get('cursor') || undefined

    const { page: normalizedPage, limit: normalizedLimit } =
      normalizePaginationParams(page, limit)

    // Build where clause - only include status if it matches InvoiceStatus enum
    const validStatuses = [
      'OPEN',
      'PARTIALLY_PAID',
      'PAID',
      'OVERDUE',
      'CANCELLED',
    ]
    const isValidStatus = status && validStatuses.includes(status.toUpperCase())

    const where = {
      orgId: organizationId,
      ...(isValidStatus && { status: status.toUpperCase() as any }),
    }

    // Get total count
    const total = await prisma.invoice.count({ where })

    // Get paginated data
    const { skip, take } = getPrismaSkipTake(normalizedPage, normalizedLimit)
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        dueDate: true,
        clientId: true,
        createdAt: true,
        client: {
          select: { name: true },
        },
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : { skip }),
      take,
      orderBy: { createdAt: 'desc' as const },
    })

    // Transform to mobile format
    const mobileInvoices = invoices.map(toMobileInvoice)

    // Build response with metadata
    const response = buildPaginatedResponse(
      mobileInvoices,
      total,
      normalizedPage,
      normalizedLimit
    )

    // Set cache headers
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=180') // 3 minutes
    headers.set('Content-Type', 'application/json')

    return NextResponse.json(response, { headers })
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'mobile/invoices:get',
      level: 'error',
    })
    Sentry.captureException(error)
    console.error('[Mobile Invoices API]', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
