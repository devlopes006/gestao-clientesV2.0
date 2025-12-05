import { ClientController } from '@/infrastructure/http/controllers/client.controller'
import { NextRequest } from 'next/server'

const controller = new ClientController()

/**
 * GET /api/clients/v2/:id - Buscar cliente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return controller.get(request, params.id)
}

/**
 * PUT /api/clients/v2/:id - Atualizar cliente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return controller.update(request, params.id)
}

/**
 * DELETE /api/clients/v2/:id - Deletar cliente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return controller.delete(request, params.id)
}
