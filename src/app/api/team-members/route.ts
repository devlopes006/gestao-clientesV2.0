import { getAdminAuth } from '@/lib/firebaseAdmin'
import { prisma } from '@/lib/prisma'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/team-members?orgId=...
 * Retorna lista de usuários eligíveis (OWNER/STAFF) para designação de tasks
 */
export async function GET(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard

    const cookieStore = await cookies()
    const token = cookieStore.get('auth')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminAuth = await getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(token)
    const firebaseUid = decoded.uid

    // Verifica se o usuário é membro da org
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { memberships: true },
    })

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId') || user.memberships[0].orgId

    // Verifica se o usuário tem acesso à org
    const membership = user.memberships.find((m) => m.orgId === orgId)
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Busca todos os membros OWNER/STAFF da org
    const teamMembers = await prisma.member.findMany({
      where: {
        orgId,
        isActive: true,
        role: { in: ['OWNER', 'STAFF'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        user: { name: 'asc' },
      },
    })

    const result = teamMembers.map((member) => ({
      id: member.user.id,
      name: member.user.name || member.user.email,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
    }))

    const res = NextResponse.json(result)
    return applySecurityHeaders(req, res)
  } catch (error) {
    console.error('Erro ao buscar membros da equipe:', error)
    const res = NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
    return applySecurityHeaders(req, res)
  }
}
