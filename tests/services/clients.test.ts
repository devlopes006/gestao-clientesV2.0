import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  createClient,
  getClientById,
  listClientsByOrg,
} from '@/services/repositories/clients'

const mockedPrisma = prisma as unknown as {
  client: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
}

describe('listClientsByOrg', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return mapped clients for organization', async () => {
    const mockClients = [
      {
        id: 'client-1',
        name: 'Client One',
        email: 'client1@example.com',
        phone: '1234567890',
        status: 'active',
        plan: 'premium',
        mainChannel: 'instagram',
        instagramUserId: null,
        instagramUsername: null,
        instagramAccessToken: null,
        instagramTokenExpiresAt: null,
        orgId: 'org-1',
        clientUserId: null,
        contractValue: 1000,
        paymentDay: 5,
        contractStart: new Date('2024-01-01'),
        contractEnd: new Date('2024-12-31'),
        isInstallment: false,
        installmentCount: null,
        installmentValue: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ]

    mockedPrisma.client.findMany.mockResolvedValue(mockClients)

    const result = await listClientsByOrg('org-1')

    expect(mockedPrisma.client.findMany).toHaveBeenCalledWith({
      where: { orgId: 'org-1' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'client-1',
      name: 'Client One',
      email: 'client1@example.com',
      status: 'active',
    })
  })

  it('should return empty array when no clients found', async () => {
    mockedPrisma.client.findMany.mockResolvedValue([])

    const result = await listClientsByOrg('org-empty')

    expect(result).toEqual([])
  })
})

describe('getClientById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return client when found', async () => {
    const mockClient = {
      id: 'client-1',
      name: 'Client One',
      email: 'client1@example.com',
      phone: '1234567890',
      status: 'active',
      plan: 'premium',
      mainChannel: 'instagram',
      instagramUserId: null,
      instagramUsername: null,
      instagramAccessToken: null,
      instagramTokenExpiresAt: null,
      orgId: 'org-1',
      clientUserId: null,
      contractValue: 1000,
      paymentDay: 5,
      contractStart: new Date('2024-01-01'),
      contractEnd: new Date('2024-12-31'),
      isInstallment: false,
      installmentCount: null,
      installmentValue: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    mockedPrisma.client.findUnique.mockResolvedValue(mockClient)

    const result = await getClientById('client-1')

    expect(mockedPrisma.client.findUnique).toHaveBeenCalledWith({
      where: { id: 'client-1' },
    })
    expect(result).toMatchObject({
      id: 'client-1',
      name: 'Client One',
      status: 'active',
    })
  })

  it('should return null when client not found', async () => {
    mockedPrisma.client.findUnique.mockResolvedValue(null)

    const result = await getClientById('non-existent')

    expect(result).toBeNull()
  })

  it('should return null when id is empty or invalid', async () => {
    expect(await getClientById('')).toBeNull()
    expect(await getClientById('   ')).toBeNull()
    expect(await getClientById()).toBeNull()
  })
})

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create and return new client', async () => {
    const mockClient = {
      id: 'client-new',
      name: 'New Client',
      email: 'new@example.com',
      phone: '9876543210',
      status: 'new',
      plan: 'basic',
      mainChannel: 'facebook',
      instagramUserId: null,
      instagramUsername: null,
      instagramAccessToken: null,
      instagramTokenExpiresAt: null,
      orgId: 'org-1',
      clientUserId: null,
      contractValue: 500,
      paymentDay: 10,
      contractStart: new Date('2024-02-01'),
      contractEnd: new Date('2024-12-31'),
      isInstallment: false,
      installmentCount: null,
      installmentValue: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockedPrisma.client.create.mockResolvedValue(mockClient)

    const result = await createClient({
      name: 'New Client',
      email: 'new@example.com',
      phone: '9876543210',
      status: 'new',
      plan: 'basic',
      mainChannel: 'facebook',
      orgId: 'org-1',
      contractValue: 500,
      paymentDay: 10,
      contractStart: new Date('2024-02-01'),
      contractEnd: new Date('2024-12-31'),
    })

    expect(mockedPrisma.client.create).toHaveBeenCalledWith({
      data: {
        name: 'New Client',
        email: 'new@example.com',
        phone: '9876543210',
        status: 'new',
        plan: 'basic',
        mainChannel: 'facebook',
        orgId: 'org-1',
        contractValue: 500,
        paymentDay: 10,
        contractStart: expect.any(Date),
        contractEnd: expect.any(Date),
        isInstallment: false,
        installmentCount: undefined,
        installmentValue: undefined,
        installmentPaymentDays: [],
      },
    })
    expect(result).toMatchObject({
      id: 'client-new',
      name: 'New Client',
      status: 'new',
    })
  })

  it('should create client with default status when not provided', async () => {
    const mockClient = {
      id: 'client-default',
      name: 'Default Client',
      email: null,
      phone: null,
      status: 'new',
      plan: null,
      mainChannel: null,
      instagramUserId: null,
      instagramUsername: null,
      instagramAccessToken: null,
      instagramTokenExpiresAt: null,
      orgId: 'org-1',
      clientUserId: null,
      contractValue: null,
      paymentDay: null,
      contractStart: null,
      contractEnd: null,
      isInstallment: false,
      installmentCount: null,
      installmentValue: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockedPrisma.client.create.mockResolvedValue(mockClient)

    const result = await createClient({
      name: 'Default Client',
      orgId: 'org-1',
    })

    expect(result.status).toBe('new')
  })
})
