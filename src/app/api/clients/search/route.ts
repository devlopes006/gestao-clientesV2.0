import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { apiRatelimit, checkRateLimit, getIdentifier } from '@/lib/ratelimit'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  take: z.coerce.number().int().min(1).max(50).optional(),
})

export async function GET(req: NextRequest) {
  const { orgId, role } = await getSessionProfile()
  if (!orgId || !role)
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!can(role as AppRole, 'read', 'client'))
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const url = new URL(req.url)
  const parsed = searchQuerySchema.safeParse({
    q: url.searchParams.get('q') ?? undefined,
    take: url.searchParams.get('take') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', details: parsed.error.format() },
      { status: 400 }
    )
  }
  const { q, take } = parsed.data

  // Rate limit busca por nome
  const idKey = getIdentifier(req)
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
  const items = await prisma.client.findMany({
    where: { orgId, name: { contains: q, mode: 'insensitive' } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: take ?? 20,
  })
  return NextResponse.json({ data: items, meta: { limit: take ?? 20 } })
}
