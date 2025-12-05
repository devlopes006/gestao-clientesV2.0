import {
  buildPaginatedResponse,
  getPrismaSkipTake,
  normalizePaginationParams,
  toMobileClient,
} from '@/lib/mobile/optimization'
import { prisma } from '@/lib/prisma'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { getAuthContext } from '@/middleware/auth'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/mobile/clients
 *
 * Lightweight clients endpoint for mobile apps
 * Response ~40% smaller than full client response
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (optional)
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
    const search = searchParams.get('search') || ''
    const cursor = searchParams.get('cursor') || undefined

    const { page: normalizedPage, limit: normalizedLimit } =
      normalizePaginationParams(page, limit)

    // Build where clause
    const where = {
      orgId: organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    // Get total count
    const total = await prisma.client.count({ where })

    // Get paginated data
    const { skip, take } = getPrismaSkipTake(normalizedPage, normalizedLimit)
    const clients = await prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : { skip }),
      take,
      orderBy: { createdAt: 'desc' as const },
    })

    // Transform to mobile format
    const mobileClients = clients.map(toMobileClient)

    // Build response with metadata
    const response = buildPaginatedResponse(
      mobileClients,
      total,
      normalizedPage,
      normalizedLimit
    )

    // Set cache headers
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=300') // 5 minutes
    headers.set('Content-Type', 'application/json')

    return NextResponse.json(response, { headers })
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'mobile/clients:get',
      level: 'error',
    })
    Sentry.captureException(error)
    console.error('[Mobile Clients API]', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}
