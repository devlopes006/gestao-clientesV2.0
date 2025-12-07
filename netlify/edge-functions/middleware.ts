/**
 * Netlify Edge Function Middleware
 * This is a DIRECT replacement that bypasses Next.js middleware compilation issues
 */

import type { Context } from 'https://edge.netlify.com'

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)

  // Skip middleware for static assets
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('.') // files with extensions
  ) {
    return context.next()
  }

  // Clone the response from the origin
  const response = await context.next()

  // Add security headers only in production
  if (context.deploy.context === 'production') {
    const newHeaders = new Headers(response.headers)

    // CSP with unsafe-inline for Next.js compatibility
    const csp = [
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
    ].join('; ')

    newHeaders.set('Content-Security-Policy', csp)
    newHeaders.set('X-Content-Type-Options', 'nosniff')
    newHeaders.set('X-Frame-Options', 'SAMEORIGIN')
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    newHeaders.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }

  return response
}

export const config = {
  path: '/*',
  excludedPath: [
    '/_next/*',
    '/static/*',
    '/*.ico',
    '/*.png',
    '/*.jpg',
    '/*.jpeg',
    '/*.gif',
    '/*.svg',
    '/*.webp',
    '/*.woff',
    '/*.woff2',
    '/*.ttf',
    '/*.eot',
  ],
}
