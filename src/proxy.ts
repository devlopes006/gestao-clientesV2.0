import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Lê role do cookie para controle de acesso básico no middleware
function getRole(req: NextRequest): string | null {
  const role = req.cookies.get('role')?.value
  if (!role) return null
  if (['OWNER', 'STAFF', 'CLIENT'].includes(role)) return role
  return null
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('auth')?.value

  const pathname = req.nextUrl.pathname
  const isLoginRoute = pathname.startsWith('/login')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isInviteValidation =
    pathname.startsWith('/api/invites/accept') && req.method === 'GET'
  // Allow creating a session without an existing auth cookie (POST /api/session)
  const isSessionCreate = pathname === '/api/session' && req.method === 'POST'
  // Allow WhatsApp integrations (external and internal APIs)
  const isWhatsAppWebhook =
    pathname.startsWith('/api/integrations/whatsapp/webhook') &&
    req.method === 'POST'
  const isWhatsAppAPI = pathname.startsWith('/api/integrations/whatsapp/')
  // Allow Landing Page lead submissions (public endpoint with HMAC verification)
  const isLeadsAPI = pathname === '/api/leads' && req.method === 'POST'

  // Bypass known static/asset paths immediately so middleware never intercepts
  // requests for Next static assets, service worker, or common static files.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/assets/')
  ) {
    return NextResponse.next()
  }

  // Allow session creation (login) to pass through without redirect
  if (isSessionCreate) return NextResponse.next()

  // Allow WhatsApp integrations to pass through without authentication
  if (isWhatsAppWebhook || isWhatsAppAPI) return NextResponse.next()

  // Allow Landing Page lead submissions without authentication (uses HMAC)
  if (isLeadsAPI) return NextResponse.next()

  // Cria response que será modificada com headers de segurança
  const response = NextResponse.next()

  // Adiciona headers de segurança
  if (process.env.NODE_ENV === 'production') {
    // CORS - apenas permite o domínio da aplicação
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      response.headers.set('Access-Control-Allow-Origin', appUrl)
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      )
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      )
    }

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    // Content Security Policy - Usando unsafe-inline para compatibilidade com Netlify Edge
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com https://us.i.posthog.com",
      "script-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com https://us.i.posthog.com",
      "worker-src 'self' blob:",
      "connect-src 'self' https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.google.com https://www.googleapis.com https://*.r2.cloudflarestorage.com https://us.i.posthog.com https://*.posthog.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https://*.r2.cloudflarestorage.com blob: data:",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
      "form-action 'self' https://accounts.google.com",
      "frame-ancestors 'self'",
    ]

    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  }

  // Permite rota de callback passar sem verificação (ela mesma valida o token)
  if (isAuthCallback) {
    return response
  }

  if (!token) {
    // Permite validar convite sem autenticação (GET /api/invites/accept)
    if (isInviteValidation) return response

    // Allow creating a session (POST /api/session) without an auth cookie
    if (isSessionCreate) return response

    // Allow WhatsApp integrations
    if (isWhatsAppWebhook || isWhatsAppAPI) return response

    if (isLoginRoute) return response

    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Controle de acesso baseado em role (validação adicional nas páginas via getSessionProfile)
  const role = getRole(req)

  // Bloqueia CLIENT de acessar áreas administrativas
  if (pathname.startsWith('/dashboard') && role === 'CLIENT') {
    return NextResponse.redirect(new URL('/clients', req.url))
  }

  // Apenas OWNER pode acessar admin e billing
  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/billing')) &&
    role &&
    role !== 'OWNER'
  ) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return response
}

// Middleware config is defined in root-level middleware.ts

// Helpers reutilizáveis para rotas sem middleware (Netlify)
export function applySecurityHeaders(req: NextRequest, res?: NextResponse) {
  const response = res ?? NextResponse.next()

  // Nonce removido - incompatível com Netlify plugin auto-injection
  // CSP usa 'unsafe-inline' para compatibilidade com Next.js inline scripts

  if (process.env.NODE_ENV === 'production') {
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
      response.headers.set('Access-Control-Allow-Origin', appUrl)
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      )
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      )
    }

    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com https://us.i.posthog.com",
      "script-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com https://us.i.posthog.com",
      "worker-src 'self' blob:",
      "connect-src 'self' https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.google.com https://www.googleapis.com https://*.r2.cloudflarestorage.com https://us.i.posthog.com https://*.posthog.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https://*.r2.cloudflarestorage.com blob: data:",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
      "form-action 'self' https://accounts.google.com",
      "frame-ancestors 'self'",
    ]
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  }

  return response
}

export function guardAccess(req: NextRequest) {
  const token = req.cookies.get('auth')?.value
  const pathname = req.nextUrl.pathname
  const isLoginRoute = pathname.startsWith('/login')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isInviteValidation =
    pathname.startsWith('/api/invites/accept') && req.method === 'GET'
  const isSessionCreate = pathname === '/api/session' && req.method === 'POST'
  const isWhatsAppWebhook =
    pathname.startsWith('/api/integrations/whatsapp/webhook') &&
    req.method === 'POST'
  const isWhatsAppAPI = pathname.startsWith('/api/integrations/whatsapp/')

  if (isAuthCallback) return null

  if (!token) {
    if (
      isInviteValidation ||
      isLoginRoute ||
      isSessionCreate ||
      isWhatsAppWebhook ||
      isWhatsAppAPI
    )
      return null
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const role = getRole(req)

  if (pathname.startsWith('/dashboard') && role === 'CLIENT') {
    return NextResponse.redirect(new URL('/clients', req.url))
  }

  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/billing')) &&
    role &&
    role !== 'OWNER'
  ) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return null
}
