import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { proxy as proxyFn } from './src/proxy'

export function middleware(req: NextRequest) {
  if (process.env.NETLIFY_DISABLE_MIDDLEWARE === 'true') {
    // No-op on Netlify to avoid middleware nft checks during build
    return NextResponse.next()
  }
  return proxyFn(req)
}

export const config = {
  matcher: [
    // Removed generic root matcher ('/') to avoid intercepting static assets
    // like '/_next/*' which previously caused asset requests to be redirected
    // to `/login` when unauthenticated. Only explicitly protect app routes.
    '/clients/:path*',
    '/client/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    // Protege APIs sensíveis
    '/api/clients/:path*',
    '/api/transactions/:path*',
    '/api/tasks/:path*',
    '/api/invites/:path*',
    '/onboarding/:path*',
    '/login/:path*',
    '/auth/:path*',
  ],
}

// Do not export default; Next.js expects a named export `middleware`
