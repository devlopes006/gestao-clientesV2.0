import { ClientStatus } from '@/domain/client/value-objects/client-status.vo'
import { authenticateRequest } from '@/infra/http/auth-middleware'
import { PrismaClientRepository } from '@/infrastructure/database/repositories/prisma-client.repository'
import { prisma } from '@/lib/prisma'
import { CreateClientUseCase } from '@/use-cases/client/create-client.use-case'
import { DeleteClientUseCase } from '@/use-cases/client/delete-client.use-case'
import { GetClientUseCase } from '@/use-cases/client/get-client.use-case'
import { ListClientsUseCase } from '@/use-cases/client/list-clients.use-case'
import { UpdateClientUseCase } from '@/use-cases/client/update-client.use-case'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Controller HTTP para Clientes
 * Responsável por lidar com requisições HTTP relacionadas a clientes
 */
export class ClientController {
  private readonly clientRepository: PrismaClientRepository

  constructor() {
    this.clientRepository = new PrismaClientRepository(prisma)
  }

  /**
   * POST /api/clients - Criar novo cliente
   */
  async create(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        allowedRoles: ['OWNER'],
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Parse do body
      const body = await request.json()

      // 3. Executar use case
      const createClientUseCase = new CreateClientUseCase(this.clientRepository)
      const result = await createClientUseCase.execute({
        ...body,
        orgId,
      })

      // 4. Retornar sucesso
      return NextResponse.json({ id: result.clientId }, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar cliente:', error)

      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * GET /api/clients - Listar clientes
   */
  async list(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Parse dos query params
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const search = searchParams.get('search') || undefined
      const statusParam = searchParams.get('status')

      // Mapear strings para ClientStatus enum
      const status = statusParam
        ? statusParam
            .split(',')
            .map((s) => {
              const upper = s.toUpperCase()
              return upper in ClientStatus
                ? ClientStatus[upper as keyof typeof ClientStatus]
                : undefined
            })
            .filter((s): s is ClientStatus => s !== undefined)
        : undefined

      // 3. Executar use case
      const listClientsUseCase = new ListClientsUseCase(this.clientRepository)
      const result = await listClientsUseCase.execute({
        orgId,
        page,
        limit,
        search,
        status,
      })

      // 4. Retornar sucesso
      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao listar clientes:', error)

      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * GET /api/clients/:id - Buscar cliente específico
   */
  async get(request: NextRequest, clientId: string): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Executar use case
      const getClientUseCase = new GetClientUseCase(this.clientRepository)
      const result = await getClientUseCase.execute({
        clientId,
        orgId,
      })

      // 3. Retornar sucesso
      return NextResponse.json(result.client)
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)

      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Cliente não encontrado' ? 404 : 400 }
        )
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * PUT /api/clients/:id - Atualizar cliente
   */
  async update(request: NextRequest, clientId: string): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Parse do body
      const body = await request.json()

      // 3. Executar use case
      const updateClientUseCase = new UpdateClientUseCase(this.clientRepository)
      const result = await updateClientUseCase.execute({
        ...body,
        clientId,
        orgId,
      })

      // 4. Retornar sucesso
      return NextResponse.json({ id: result.clientId })
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)

      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Cliente não encontrado' ? 404 : 400 }
        )
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }

  /**
   * DELETE /api/clients/:id - Deletar cliente
   */
  async delete(request: NextRequest, clientId: string): Promise<NextResponse> {
    try {
      // 1. Autenticação
      const authResult = await authenticateRequest(request, {
        requireOrg: true,
      })

      if ('error' in authResult) {
        return authResult.error
      }

      const { orgId } = authResult.context

      // 2. Executar use case
      const deleteClientUseCase = new DeleteClientUseCase(this.clientRepository)
      const result = await deleteClientUseCase.execute({
        clientId,
        orgId,
      })

      // 3. Retornar sucesso
      return NextResponse.json({ id: result.clientId })
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)

      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Cliente não encontrado' ? 404 : 400 }
        )
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  }
}
