import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/auth/session', () => ({
  getSessionProfile: vi.fn(),
}))

vi.mock('@/lib/permissions', () => ({
  can: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    finance: {
      findMany: vi.fn(),
    },
  },
}))

// Import after mocks
import { GET } from '@/app/api/finance/route'
import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'

const mockedGetSession = getSessionProfile as unknown as ReturnType<
  typeof vi.fn
>
const mockedCan = can as unknown as ReturnType<typeof vi.fn>

describe('GET /api/finance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockedGetSession.mockResolvedValue({ user: null, orgId: null, role: null })
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('returns finances when authorized', async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
    mockedCan.mockReturnValue(true)
    ;(
      prisma.finance.findMany as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce([
      {
        id: 'f1',
        type: 'income',
        amount: 100,
        description: 'Mensalidade',
        category: 'Mensalidade',
        date: new Date().toISOString(),
        clientId: 'c1',
        client: { id: 'c1', name: 'Cliente' },
      },
    ])

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0]).toHaveProperty('id', 'f1')
  })
})
