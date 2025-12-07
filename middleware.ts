// MIDDLEWARE DESABILITADO - Usando Edge Function nativo do Netlify
// Veja: netlify/edge-functions/middleware.ts

// import type { NextRequest } from 'next/server'
// import { NextResponse } from 'next/server'
// import { proxy as proxyFn } from './src/proxy'

// export async function middleware(req: NextRequest) {
//   try {
//     const result = await proxyFn(req)
//     // Ensure we always return a valid Response
//     return result || NextResponse.next()
//   } catch (error) {
//     console.error('[middleware] Error:', error)
//     // Return next() on error to avoid breaking the request
//     return NextResponse.next()
//   }
// }

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
