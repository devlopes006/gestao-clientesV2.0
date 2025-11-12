import { prisma } from '@/lib/prisma'
import { ClientStatus } from '@/types/client'
import { AppClient } from '@/types/tables'

export async function listClientsByOrg(orgId: string): Promise<AppClient[]> {
  const rows = await prisma.client.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    status: r.status as ClientStatus,
    plan: r.plan ?? null,
    main_channel: r.mainChannel ?? null,
    orgId: r.orgId,
    clientUserId: r.clientUserId ?? null,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }))
}

export async function getClientById(id: string): Promise<AppClient | null> {
  const client = await prisma.client.findUnique({
    where: { id },
  })

  if (!client) return null

  return {
    id: client.id,
    name: client.name,
    email: client.email ?? null,
    phone: client.phone ?? null,
    status: client.status as ClientStatus,
    plan: client.plan ?? null,
    main_channel: client.mainChannel ?? null,
    orgId: client.orgId,
    clientUserId: client.clientUserId ?? null,
    created_at: client.createdAt.toISOString(),
    updated_at: client.updatedAt.toISOString(),
  }
}

export interface CreateClientInput {
  name: string
  email?: string
  phone?: string
  status?: ClientStatus
  plan?: string
  mainChannel?: string
  orgId: string
}

export async function createClient(
  data: CreateClientInput
): Promise<AppClient> {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: data.status || 'new',
      plan: data.plan,
      mainChannel: data.mainChannel,
      orgId: data.orgId,
    },
  })

  return {
    id: client.id,
    name: client.name,
    email: client.email ?? null,
    phone: client.phone ?? null,
    status: client.status as ClientStatus,
    plan: client.plan ?? null,
    main_channel: client.mainChannel ?? null,
    orgId: client.orgId,
    clientUserId: client.clientUserId ?? null,
    created_at: client.createdAt.toISOString(),
    updated_at: client.updatedAt.toISOString(),
  }
}
