import { adminAuth } from '@/lib/firebaseAdmin'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DEBUG ENDPOINT para diagnosticar problemas de login em mobile
 * GET /api/debug/auth-flow
 *
 * Retorna informações detalhadas sobre:
 * - Status da sessão atual
 * - Cookies de autenticação
 * - Estado do Firebase
 * - User Agent (para confirmar mobile)
 */
export async function GET(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const isMobile =
    /android|iphone|ipad|ipod|mobile|windows phone/i.test(
      userAgent.toLowerCase()
    ) || false

  const debugInfo: {
    timestamp: string
    isMobile: boolean
    userAgent: string
    session: {
      user: {
        id: string
        email: string
        name: string | null
        image?: string | null
      } | null
      orgId: string | null
      role: string | null
      error?: string
    }
    cookies: {
      authCookie: boolean
      sameSite: string
    }
    headers: {
      origin: string
      referer: string
      host: string
    }
  } = {
    timestamp: new Date().toISOString(),
    isMobile,
    userAgent,
    session: { user: null, orgId: null, role: null },
    cookies: {
      authCookie: false,
      sameSite: 'lax',
    },
    headers: {
      origin: req.headers.get('origin') || 'unknown',
      referer: req.headers.get('referer') || 'unknown',
      host: req.headers.get('host') || 'unknown',
    },
  }

  try {
    const { user, orgId, role } = await getSessionProfile()
    debugInfo.session = { user, orgId, role }
    debugInfo.cookies.authCookie = !!user
  } catch (err) {
    debugInfo.session.error =
      err instanceof Error ? err.message : 'Unknown error'
  }

  return NextResponse.json(debugInfo, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': debugInfo.headers.origin,
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

/**
 * POST /api/debug/auth-flow
 * Testa o fluxo de criação de sessão
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    idToken?: string
  }

  const result: {
    step: string
    success: boolean
    error?: string
    details?: object
  }[] = []

  try {
    // Step 1: Verify token
    result.push({
      step: 'verify_token',
      success: false,
    })

    if (!body.idToken) {
      result[0].error = 'No idToken provided'
      return NextResponse.json(
        { steps: result, error: 'No idToken' },
        { status: 400 }
      )
    }

    let decoded
    try {
      decoded = await adminAuth.verifyIdToken(body.idToken)
      result[0] = {
        ...result[0],
        success: true,
        details: {
          uid: decoded.uid,
          email: decoded.email,
        },
      }
    } catch (err) {
      result[0].error =
        err instanceof Error ? err.message : 'Token verification failed'
      return NextResponse.json({ steps: result }, { status: 400 })
    }

    // Step 2: Check user in database
    result.push({
      step: 'find_user_in_db',
      success: false,
    })

    try {
      const user = await prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      })
      result[1] = {
        ...result[1],
        success: !!user,
        details: {
          found: !!user,
          userId: user?.id,
          email: user?.email,
        },
      }
    } catch (err) {
      result[1].error = err instanceof Error ? err.message : 'DB query failed'
    }

    // Step 3: Check session
    result.push({
      step: 'check_session',
      success: false,
    })

    try {
      const { user, orgId } = await getSessionProfile()
      result[2] = {
        ...result[2],
        success: !!user,
        details: {
          hasUser: !!user,
          orgId,
        },
      }
    } catch (err) {
      result[2].error =
        err instanceof Error ? err.message : 'Session check failed'
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      steps: result,
      allSuccess: result.every((s) => s.success),
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
