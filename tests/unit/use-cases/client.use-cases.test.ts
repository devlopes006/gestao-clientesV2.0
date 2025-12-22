import { Client } from '@/core/domain/client/entities/client.entity'
import { ClientStatus } from '@/core/domain/client/value-objects/client-status.vo'
import { Email } from '@/core/domain/client/value-objects/email.vo'
import {
  ClientRepository,
  CreateClientRepositoryInput,
  ListClientsRepositoryInput,
  ListClientsRepositoryOutput,
} from '@/core/ports/repositories/client.repository'
import { CreateClientUseCase } from '@/core/use-cases/client/create-client.use-case'
import { DeleteClientUseCase } from '@/core/use-cases/client/delete-client.use-case'
import { GetClientUseCase } from '@/core/use-cases/client/get-client.use-case'
import { ListClientsUseCase } from '@/core/use-cases/client/list-clients.use-case'
import { UpdateClientUseCase } from '@/core/use-cases/client/update-client.use-case'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// UUID Generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Mock Repository
class MockClientRepository implements ClientRepository {
  private clients: Map<string, Client> = new Map()
  private clientCounter = 0

  async create(data: CreateClientRepositoryInput): Promise<Client> {
    const id = `client-${++this.clientCounter}`
    const client = Client.create({
      id,
      orgId: data.orgId,
      name: data.name,
      email: data.email ? new Email(data.email) : undefined,
      phone: data.phone,
      status: data.status || ('NEW' as ClientStatus),
      plan: data.plan || null,
      mainChannel: data.mainChannel || null,
      contractStart: data.contractStart || null,
      contractEnd: data.contractEnd || null,
      paymentDay: data.paymentDay || null,
      contractValue: data.contractValue || null,
      isInstallment: data.isInstallment || false,
      installmentCount: data.installmentCount || null,
      installmentValue: data.installmentValue || null,
      installmentPaymentDays: data.installmentPaymentDays || null,
    })
    this.clients.set(id, client)
    return client
  }

  async findClientForUser(): Promise<null> {
    return null
  }

  async findById(id: string): Promise<Client | null> {
    return this.clients.get(id) || null
  }

  async list(
    params: ListClientsRepositoryInput
  ): Promise<ListClientsRepositoryOutput> {
    let filtered = Array.from(this.clients.values()).filter(
      (c) => c.orgId === params.orgId && !c.isDeleted
    )

    const start = params.cursor ? parseInt(params.cursor) : 0
    const data = filtered.slice(start, start + params.take)
    const hasNextPage = start + params.take < filtered.length
    const nextCursor = hasNextPage ? (start + params.take).toString() : null

    return {
      data,
      hasNextPage,
      nextCursor,
    }
  }

  addClient(client: any): void {
    this.clients.set(client.id, client)
  }

  async save(client: any): Promise<void> {
    this.clients.set(client.id, client)
  }

  async findByEmail(email: string, orgId: string): Promise<Client | null> {
    const found = Array.from(this.clients.values()).find(
      (c) => c.orgId === orgId && c.email && c.email._value === email
    )
    return found || null
  }

  async findByCNPJ(cnpj: string, orgId: string): Promise<Client | null> {
    return null
  }

  async findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      status?: string[]
      search?: string
    }
  ): Promise<{ clients: Client[]; total: number }> {
    const clients = Array.from(this.clients.values()).filter(
      (c) => c.orgId === orgId && !c.isDeleted
    )
    return { clients, total: clients.length }
  }

  async delete(id: string): Promise<void> {
    const client = this.clients.get(id)
    if (client) {
      client.softDelete()
      this.clients.set(id, client)
    }
  }

  async exists(id: string): Promise<boolean> {
    const client = this.clients.get(id)
    return client ? !client.isDeleted : false
  }
}

describe('Client Use Cases', () => {
  let repository: MockClientRepository
  const orgId = generateUUID()

  beforeEach(() => {
    repository = new MockClientRepository()
  })

  describe('CreateClientUseCase', () => {
    it('should create a new client successfully', async () => {
      const mockBillingService = {
        generateInstallments: vi.fn().mockResolvedValue(undefined),
      }
      const useCase = new CreateClientUseCase(
        repository,
        mockBillingService as any
      )
      const result = await useCase.execute({
        name: 'Test Company',
        email: 'test@company.com',
        phone: '+55 11 98765-4321',
        orgId,
      })

      expect(result.id).toBeDefined()
      const saved = await repository.findById(result.id)
      expect(saved?.name).toBe('Test Company')
    })

    it('should reject duplicate email', async () => {
      const mockBillingService = {
        generateInstallments: vi.fn().mockResolvedValue(undefined),
      }
      const useCase = new CreateClientUseCase(
        repository,
        mockBillingService as any
      )

      await useCase.execute({
        name: 'First',
        email: 'test@test.com',
        orgId,
      })

      await expect(
        useCase.execute({
          name: 'Second',
          email: 'test@test.com',
          orgId,
        })
      ).rejects.toThrow()
    })
  })

  describe('GetClientUseCase', () => {
    it('should get a client by id', async () => {
      const useCase = new GetClientUseCase(repository)
      const clientId = generateUUID()

      const client = Client.create({
        id: clientId,
        name: 'Test Client',
        email: new Email('test@test.com'),
        orgId,
        status: ClientStatus.ACTIVE,
      })
      repository.addClient(client)

      const result = await useCase.execute({ clientId, orgId })
      expect(result.client.name).toBe('Test Client')
    })

    it('should throw error when not found', async () => {
      const useCase = new GetClientUseCase(repository)

      await expect(
        useCase.execute({ clientId: generateUUID(), orgId })
      ).rejects.toThrow()
    })
  })

  describe('ListClientsUseCase', () => {
    it('should list clients with pagination', async () => {
      const useCase = new ListClientsUseCase(repository)

      for (let i = 0; i < 5; i++) {
        const client = Client.create({
          id: generateUUID(),
          name: `Client ${i}`,
          email: new Email(`client${i}@test.com`),
          orgId,
          status: ClientStatus.ACTIVE,
        })
        repository.addClient(client)
      }

      const result = await useCase.execute({
        orgId,
        page: 1,
        limit: 10,
        role: 'ADMIN',
        userId: 'test',
      } as any)
      expect((result as any).data).toHaveLength(5)
      expect((result as any).meta.total).toBe(5)
    })
  })

  describe('UpdateClientUseCase', () => {
    it('should update client successfully', async () => {
      const useCase = new UpdateClientUseCase(repository)
      const clientId = generateUUID()

      const client = Client.create({
        id: clientId,
        name: 'Old Name',
        email: new Email('test@test.com'),
        orgId,
        status: ClientStatus.ACTIVE,
      })
      repository.addClient(client)

      await useCase.execute({
        clientId,
        orgId,
        name: 'New Name',
      })

      const updated = await repository.findById(clientId)
      expect(updated?.name).toBe('New Name')
    })
  })

  describe('DeleteClientUseCase', () => {
    it('should delete a client', async () => {
      const useCase = new DeleteClientUseCase(repository)
      const clientId = generateUUID()

      const client = Client.create({
        id: clientId,
        name: 'To Delete',
        email: new Email('delete@test.com'),
        orgId,
        status: ClientStatus.ACTIVE,
      })
      repository.addClient(client)

      await useCase.execute({ clientId, orgId })

      const exists = await repository.exists(clientId)
      expect(exists).toBe(false)
    })
  })
})
