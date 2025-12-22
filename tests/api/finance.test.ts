import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/auth/session', () => ({
  getSessionProfile: vi.fn(),
}))

vi.mock('@/lib/permissions', () => ({
  can: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    client: {
      findUnique: vi.fn(),
    },
  },
}))

// Import after mocks
import { DELETE, GET, PATCH, POST } from '@/app/api/finance/route'
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
      prisma.transaction.findMany as unknown as ReturnType<typeof vi.fn>
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

describe('POST /api/finance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('creates finance record when authorized', async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
    mockedCan.mockReturnValue(true)
    ;(
      prisma.client.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: 'c1', orgId: 'org1' })
    ;(
      prisma.transaction.create as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'f2',
      type: 'expense',
      amount: 50,
      description: 'Custo',
      category: 'Operacional',
      date: new Date(),
      clientId: 'c1',
      client: { id: 'c1', name: 'Cliente' },
    })

    const mockReq = {
      headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      json: async () => ({
        type: 'expense',
        amount: 50,
        description: 'Custo',
        category: 'Operacional',
        clientId: 'c1',
      }),
    } as unknown as Request

    const res = await POST(mockReq)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('id', 'f2')
  })

  it('returns 400 when required fields are missing', async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
    mockedCan.mockReturnValue(true)

    const mockReq = {
      headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      json: async () => ({ description: 'Missing type/amount' }),
    } as unknown as Request

    const res = await POST(mockReq)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/finance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('updates finance record when authorized', async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
    mockedCan.mockReturnValue(true)
    ;(
      prisma.transaction.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'f1',
      type: 'income',
      amount: 100,
      clientId: 'c1',
      client: { id: 'c1', orgId: 'org1' },
    })
    ;(
      prisma.transaction.update as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'f1',
      type: 'income',
      amount: 150,
      description: 'Atualizado',
      category: 'Mensalidade',
      date: new Date(),
      clientId: 'c1',
      client: { id: 'c1', name: 'Cliente' },
    })

    const mockReq = {
      url: 'http://localhost/api/finance?id=f1',
      headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      json: async () => ({ amount: 150, description: 'Atualizado' }),
    } as unknown as Request

    const res = await PATCH(mockReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('amount', 150)
  })

  it('returns 404 when finance not found or not in org', async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
    mockedCan.mockReturnValue(true)
    ;(
      prisma.transaction.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null)

    const mockReq = {
      url: 'http://localhost/api/finance?id=f999',
      headers: new Map([['x-forwarded-for', '127.0.0.1']]),
      json: async () => ({ amount: 150 }),
    } as unknown as Request

    const res = await PATCH(mockReq)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/finance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('deletes finance record when authorized', async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
    mockedCan.mockReturnValue(true)
    ;(
      prisma.transaction.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: 'f1',
      type: 'income',
      amount: 100,
      clientId: 'c1',
      client: { id: 'c1', orgId: 'org1' },
    })
    ;(
      prisma.transaction.delete as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: 'f1' })

    const mockReq = {
      url: 'http://localhost/api/finance?id=f1',
      headers: new Map([['x-forwarded-for', '127.0.0.1']]),
    } as unknown as Request

    const res = await DELETE(mockReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('success', true)
  })

  it('returns 404 when finance not found', async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
    mockedCan.mockReturnValue(true)
    ;(
      prisma.transaction.findUnique as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null)

    const mockReq = {
      url: 'http://localhost/api/finance?id=f999',
      headers: new Map([['x-forwarded-for', '127.0.0.1']]),
    } as unknown as Request

    const res = await DELETE(mockReq)
    expect(res.status).toBe(404)
  })
})
