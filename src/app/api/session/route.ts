import { adminAuth } from '@/lib/firebaseAdmin'
import { handleUserOnboarding } from '@/services/auth/onboarding'
import { getSessionProfile } from '@/services/auth/session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
/**
 * Retorna informações da sessão atual do usuário
 */
export async function GET() {
  try {
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      orgId,
      role,
    })
  } catch (err) {
    console.error('Erro ao obter sessão', err)
    return NextResponse.json({ error: 'Session error' }, { status: 500 })
  }
}

/**
 * Recebe ID token Firebase do cliente, seta cookie HttpOnly seguro,
 * e faz onboarding do usuário.
 */
export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string }
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    // Verifica token para extrair expiração e garantir validade
    const decoded = await adminAuth.verifyIdToken(idToken)

    const cookieStore = await cookies()
    // exp expira em segundos; converte para Date
    const expires = new Date(decoded.exp * 1000)

    cookieStore.set('auth', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires,
    })

    // Faz onboarding do usuário (cria/atualiza no Firestore e PostgreSQL)
    await handleUserOnboarding({
      uid: decoded.uid,
      email: decoded.email!,
      name: decoded.name || decoded.email!.split('@')[0],
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro ao criar sessão', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
