import { withOrgScope } from '@/lib/db/scope'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const byStatusQuerySchema = z.object({
  status: z
    .enum(['new', 'onboarding', 'active', 'paused', 'closed'])
    .optional(),
})

export async function GET(req: NextRequest) {
  const { getAuthContext } = await import('@/middleware/auth')
  const { orgId } = getAuthContext(req)
  const parsed = byStatusQuerySchema.safeParse({
    status: req.nextUrl.searchParams.get('status') ?? undefined,
  })
  const status = parsed.success ? (parsed.data.status ?? 'active') : 'active'
  if (!orgId)
    return NextResponse.json(
      { error: 'Organization ID required' },
      { status: 400 }
    )

  // Rate limit por org
  const idKey = `${orgId}:${getIdentifier(req)}`
  const rl = await checkRateLimit(idKey, apiRatelimit)
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

  // Exemplo real usando withOrgScope para respeitar RLS por organização
  const result = await withOrgScope(orgId, async (tx) => {
    const clients = await tx.client.findMany({ where: { status } })
    return clients
  })

  return NextResponse.json({ data: result, meta: { status } })
}
