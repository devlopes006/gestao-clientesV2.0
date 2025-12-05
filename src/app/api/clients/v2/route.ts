import { ClientController } from '@/infrastructure/http/controllers/client.controller'
import { NextRequest } from 'next/server'

const controller = new ClientController()

/**
 * POST /api/clients/v2 - Criar novo cliente
 */
export async function POST(request: NextRequest) {
  return controller.create(request)
}

/**
 * GET /api/clients/v2 - Listar clientes
 */
export async function GET(request: NextRequest) {
  return controller.list(request)
}
