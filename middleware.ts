import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

function getRole(req: NextRequest): string | null {
  const role = req.cookies.get('role')?.value
  if (!role) return null
  return ['OWNER', 'STAFF', 'CLIENT'].includes(role) ? role : null
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('auth')?.value

  const isLogin = pathname.startsWith('/login')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isInviteAccept = pathname.startsWith('/api/invites/accept')

  // Always allow callback and public invite validation to pass through
  if (isAuthCallback || isInviteAccept) {
    return NextResponse.next()
  }

  // If no auth token, redirect to login (except on the login page itself)
  if (!token && !isLogin) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If authenticated and on login, send home
  if (token && isLogin) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Simple role-based gates
  const role = getRole(req)

  if (pathname.startsWith('/dashboard') && role === 'CLIENT') {
    return NextResponse.redirect(new URL('/clients', req.url))
  }

  if (pathname.startsWith('/admin') && role && role !== 'OWNER') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/clients/:path*',
    '/client/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/api/invites/:path*',
    '/onboarding/:path*',
    '/login/:path*',
    '/auth/:path*',
  ],
}
