import { applySecurityHeaders, guardAccess } from '@/proxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Remove o cookie de sessão ao fazer logout.
 */
export async function POST(req: NextRequest | Request) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    const cookieStore = await cookies()

    // Remove o cookie de autenticação com as mesmas opções de quando foi criado
    cookieStore.set('auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expira imediatamente
      path: '/',
    })

    // Remove o cookie de role também
    cookieStore.set('role', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return applySecurityHeaders(req, NextResponse.json({ ok: true }))
  } catch (err) {
    console.error('Erro ao fazer logout', err)
    return applySecurityHeaders(
      req,
      NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    )
  }
}
