import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/invites/resend
 *
 * Permite renovar um convite expirado, gerando novo token e nova data de expiração.
 *
 * Body: { token: string }
 * Returns: { ok: boolean, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string }

    if (!token) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 400 })
    }

    // 1. Encontrar convite
    const invite = await prisma.invite.findUnique({ where: { token } })

    if (!invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    // 2. Verificar se ainda é válido
    if (invite.expiresAt > new Date()) {
      return NextResponse.json(
        { error: 'Esse convite ainda é válido' },
        { status: 400 }
      )
    }

    // 3. Gerar novo token
    const newToken = generateToken()
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 dias

    // 4. Atualizar invite
    const updated = await prisma.invite.update({
      where: { id: invite.id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        status: 'PENDING', // Resetar para PENDING
      },
    })

    // 5. TODO: Enviar email
    // const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invites/${newToken}`
    // await sendEmail({
    //   to: invite.email,
    //   template: 'invite-renewed',
    //   data: {
    //     inviteLink,
    //     expiresAt: newExpiresAt.toLocaleDateString('pt-BR')
    //   }
    // })

    console.log(`[Resend Invite] ✅ Convite renovado: ${invite.id}`)
    console.log(`[Resend Invite] Novo token: ${newToken}`)
    console.log(`[Resend Invite] Nova expiração: ${newExpiresAt.toISOString()}`)

    // 6. Retornar sucesso
    return NextResponse.json({
      ok: true,
      message: 'Convite renovado! Verifique seu email.',
      token: newToken, // Para testing
      expiresAt: newExpiresAt.toISOString(),
    })
  } catch (error) {
    console.error('[Resend Invite] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao renovar convite' },
      { status: 500 }
    )
  }
}

/**
 * Gera token único para convite
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
