/**
 * POST /api/refresh
 * Refresh Firebase ID Token using refresh token
 */

import { getAdminAuth } from '@/lib/firebaseAdmin'
import {
  authRatelimit,
  checkRateLimit,
  getIdentifier,
  rateLimitExceeded,
} from '@/lib/ratelimit'
import { applySecurityHeaders } from '@/proxy'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface RefreshRequestBody {
  refreshToken?: string
}

interface RefreshSuccessResponse {
  ok: true
  accessToken: string
  expiresIn: number
}

interface RefreshErrorResponse {
  ok: false
  error: string
}

// POST handler
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Rate limiting
    const identifier = getIdentifier(req)
    const rateLimitResult = await checkRateLimit(identifier, authRatelimit)
    if (!rateLimitResult.success) {
      const rateLimitResponse = rateLimitExceeded(rateLimitResult.reset)
      return applySecurityHeaders(
        req,
        rateLimitResponse as unknown as NextResponse
      )
    }

    // Parse request body
    let body: RefreshRequestBody = {}
    try {
      body = (await req.json()) as RefreshRequestBody
    } catch (e) {
      console.error('[Refresh API] Failed to parse JSON', e)
      const errorRes = NextResponse.json<RefreshErrorResponse>(
        { ok: false, error: 'Invalid request body' },
        { status: 400 }
      )
      return applySecurityHeaders(req, errorRes)
    }

    const { refreshToken } = body

    // Check if refresh token provided
    if (!refreshToken) {
      console.warn('[Refresh API] Missing refreshToken in request body')
      const errorRes = NextResponse.json<RefreshErrorResponse>(
        { ok: false, error: 'Missing refreshToken' },
        { status: 400 }
      )
      return applySecurityHeaders(req, errorRes)
    }

    // Use Firebase REST API to refresh token
    let newAccessToken: string
    let expiresIn: number

    try {
      const refreshResponse = await fetch(
        'https://securetoken.googleapis.com/v1/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            key: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
          }),
        }
      )

      if (!refreshResponse.ok) {
        const errorData = (await refreshResponse.json()) as Record<
          string,
          unknown
        >
        console.error('[Refresh API] Firebase token refresh failed', errorData)
        const errorRes = NextResponse.json<RefreshErrorResponse>(
          { ok: false, error: 'Invalid or expired refresh token' },
          { status: 401 }
        )
        return applySecurityHeaders(req, errorRes)
      }

      const data = (await refreshResponse.json()) as {
        access_token?: string
        expires_in?: string
        token_type?: string
        error?: string
      }

      if (!data.access_token) {
        console.error('[Refresh API] No access token in response', data)
        const errorRes = NextResponse.json<RefreshErrorResponse>(
          { ok: false, error: 'Failed to generate new token' },
          { status: 500 }
        )
        return applySecurityHeaders(req, errorRes)
      }

      newAccessToken = data.access_token
      expiresIn = parseInt(data.expires_in || '3600', 10)

      // Verify the new token is valid
      const adminAuth = await getAdminAuth()
      const decoded = await adminAuth.verifyIdToken(newAccessToken)
      if (!decoded) {
        throw new Error('Failed to verify refreshed token')
      }
    } catch (error) {
      console.error('[Refresh API] Token refresh error', error)
      const errorRes = NextResponse.json<RefreshErrorResponse>(
        { ok: false, error: 'Token refresh failed' },
        { status: 500 }
      )
      return applySecurityHeaders(req, errorRes)
    }

    // Create success response
    const successRes = NextResponse.json<RefreshSuccessResponse>(
      {
        ok: true,
        accessToken: newAccessToken,
        expiresIn,
      },
      { status: 200 }
    )

    // Update auth cookie with new token
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    const expires = new Date(Date.now() + expiresIn * 1000)

    cookieStore.set('auth', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      expires,
    })

    return applySecurityHeaders(req, successRes)
  } catch (error) {
    console.error('[Refresh API] Unexpected error', error)
    const errorRes = NextResponse.json<RefreshErrorResponse>(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
    return applySecurityHeaders(req, errorRes)
  }
}

// Only allow POST
export async function GET(): Promise<Response> {
  return NextResponse.json<RefreshErrorResponse>(
    { ok: false, error: 'Method not allowed' },
    { status: 405 }
  )
}
