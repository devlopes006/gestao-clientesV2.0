'use server'

import { prisma } from '@/lib/prisma'
import { generateInviteToken } from '@/lib/tokens'
import { getSessionProfile } from '@/services/auth/session'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function updateMemberRoleAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile()

  if (!user || !orgId || role !== 'OWNER') {
    throw new Error(
      'Não autorizado. Apenas proprietários podem alterar papéis.'
    )
  }

  const memberId = formData.get('member_id') as string
  const newRole = formData.get('role') as Role

  if (!memberId || !newRole) {
    throw new Error('Dados inválidos')
  }

  // Verificar se o membro pertence à mesma organização
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  })

  if (!member || member.orgId !== orgId) {
    throw new Error('Membro não encontrado ou não pertence à sua organização')
  }

  // Não permitir remover o último owner
  if (member.role === 'OWNER' && newRole !== 'OWNER') {
    const ownerCount = await prisma.member.count({
      where: { orgId, role: 'OWNER' },
    })

    if (ownerCount <= 1) {
      throw new Error('Não é possível alterar o papel do último proprietário')
    }
  }

  await prisma.member.update({
    where: { id: memberId },
    data: { role: newRole },
  })

  revalidatePath('/admin/members')
}

export async function deleteMemberAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile()

  if (!user || !orgId || role !== 'OWNER') {
    throw new Error(
      'Não autorizado. Apenas proprietários podem remover membros.'
    )
  }

  const memberId = formData.get('member_id') as string

  if (!memberId) {
    throw new Error('ID do membro não fornecido')
  }

  // Verificar se o membro pertence à mesma organização
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  })

  if (!member || member.orgId !== orgId) {
    throw new Error('Membro não encontrado ou não pertence à sua organização')
  }

  // Não permitir remover owners
  if (member.role === 'OWNER') {
    throw new Error('Não é possível remover um proprietário')
  }

  await prisma.member.delete({
    where: { id: memberId },
  })

  revalidatePath('/admin/members')
}

export async function inviteStaffAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile()

  if (!user || !orgId || role !== 'OWNER') {
    throw new Error(
      'Não autorizado. Apenas proprietários podem convidar membros.'
    )
  }

  const email = (formData.get('email') as string)?.toLowerCase().trim()
  // Nome opcional (pode ser usado futuramente)
  const fullNameRaw = formData.get('full_name') as string | null
  // deliberately unused: retained for future customization; prefix to ignore
  void fullNameRaw
  const inviteRole = formData.get('role') as Role
  const clientId = formData.get('client_id') as string | null

  if (!email) {
    throw new Error('Email é obrigatório')
  }
  if (!['STAFF', 'CLIENT'].includes(inviteRole)) {
    throw new Error('Papel inválido para convite')
  }

  if (inviteRole === 'CLIENT' && clientId) {
    // Verifica se client pertence à mesma org e se já está vinculado
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, orgId },
      select: { id: true, clientUserId: true },
    })
    if (!existingClient) {
      throw new Error('Cliente não encontrado na organização')
    }
    if (existingClient.clientUserId) {
      throw new Error('Este cliente já está vinculado a um usuário')
    }
  }

  // Já é membro?
  const existingMember = await prisma.member.findFirst({
    where: { orgId, user: { email } },
    include: { user: true },
  })
  if (existingMember) {
    throw new Error('Este e-mail já possui acesso à organização')
  }

  // Convite pendente existente?
  const pendingInvite = await prisma.invite.findFirst({
    where: { orgId, email, status: 'PENDING' },
  })
  if (pendingInvite) {
    throw new Error('Já existe um convite pendente para este e-mail')
  }

  const token = generateInviteToken(32)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 dias

  await prisma.invite.create({
    data: {
      orgId,
      email,
      roleRequested: inviteRole,
      token,
      expiresAt,
      clientId: inviteRole === 'CLIENT' ? clientId || undefined : undefined,
    },
  })

  // TODO: Enviar e-mail com link de aceite /invite/${token}
  revalidatePath('/admin/members')
}

export async function cancelInviteAction(formData: FormData) {
  const { user, orgId, role } = await getSessionProfile()
  if (!user || !orgId || role !== 'OWNER') {
    throw new Error('Não autorizado.')
  }
  const inviteId = formData.get('invite_id') as string
  if (!inviteId) throw new Error('ID do convite não fornecido')

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
  if (!invite || invite.orgId !== orgId) {
    throw new Error('Convite não encontrado')
  }
  if (invite.status !== 'PENDING') {
    throw new Error('Somente convites pendentes podem ser cancelados')
  }
  await prisma.invite.update({
    where: { id: inviteId },
    data: { status: 'CANCELED' },
  })
  revalidatePath('/admin/members')
}
