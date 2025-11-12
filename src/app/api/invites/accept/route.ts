import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

// Aceita convite: cria membership e, se papel CLIENT, vincula ou cria Client exclusivo.
export async function POST(req: Request) {
  try {
    const { token } = (await req.json()) as { token?: string }
    if (!token)
      return NextResponse.json({ error: 'Token ausente' }, { status: 400 })

    const { user } = await getSessionProfile()
    if (!user)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const invite = await prisma.invite.findUnique({ where: { token } })
    if (!invite)
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    if (invite.status !== 'PENDING')
      return NextResponse.json(
        { error: 'Convite não está pendente' },
        { status: 400 }
      )
    if (invite.expiresAt < new Date()) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json({ error: 'Convite expirado' }, { status: 400 })
    }

    const existingMembership = await prisma.member.findFirst({
      where: { orgId: invite.orgId, userId: user.id },
    })
    if (!existingMembership) {
      await prisma.member.create({
        data: {
          orgId: invite.orgId,
          userId: user.id,
          role: invite.roleRequested,
        },
      })
    }

    let nextPath = '/'
    if (invite.roleRequested === 'CLIENT') {
      if (invite.clientId) {
        // Vincula cliente existente ao usuário (somente se ainda não vinculado)
        await prisma.client.updateMany({
          where: { id: invite.clientId, clientUserId: null },
          data: { clientUserId: user.id },
        })
        nextPath = `/clients/${invite.clientId}/info`
      } else {
        // Cria novo cliente vinculado ao usuário
        const created = await prisma.client.create({
          data: {
            name: user.name || user.email.split('@')[0],
            email: user.email,
            orgId: invite.orgId,
            status: 'active',
            clientUserId: user.id,
          },
        })
        nextPath = `/clients/${created.id}/info`
      }
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    })
    return NextResponse.json({ ok: true, nextPath })
  } catch (e) {
    console.error('Erro ao aceitar convite', e)
    return NextResponse.json(
      { error: 'Falha ao aceitar convite' },
      { status: 500 }
    )
  }
}
