import {
  getFirebaseCredentials,
  getFirebaseCredentialsSync,
} from '@/lib/firebase-credentials'
import { logger } from '@/lib/logger'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

let cachedAuth: Auth | null = null
let authPromise: Promise<Auth> | null = null

function normalizePrivateKey(key: string): string {
  // If key already has real newlines, return as-is
  if (key.includes('\n')) {
    return key
  }
  // Otherwise, replace escaped newlines
  return key.replace(/\\n/g, '\n')
}

function buildCredentialArgs() {
  const creds = getFirebaseCredentialsSync()
  const privateKey = normalizePrivateKey(creds.privateKey)

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    const preview = privateKey.substring(0, 50)
    logger.error('Invalid Firebase private key format', {
      preview,
      hasNewlines: privateKey.includes('\n'),
      hasEscapedNewlines: creds.privateKey.includes('\\n'),
      length: privateKey.length,
    })
    throw new Error(
      'FIREBASE_PRIVATE_KEY format is invalid. Must be a valid PEM-encoded private key.'
    )
  }

  return {
    projectId: creds.projectId,
    clientEmail: creds.clientEmail,
    privateKey,
  }
}

function initSync(): Auth | null {
  try {
    const { projectId, clientEmail, privateKey } = buildCredentialArgs()

    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    cachedAuth = getAuth(app)

    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Firebase Admin inicializado (sync)', {
        projectId,
        clientEmailDomain: clientEmail.split('@')[1],
      })
    }

    return cachedAuth
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      throw error instanceof Error ? error : new Error(String(error))
    }
    logger.error('Firebase Admin sync init failed', {
      error: error instanceof Error ? error.message : String(error),
      code:
        error instanceof Error && 'code' in error
          ? (error as any).code
          : undefined,
    })
    return null
  }
}

async function initAsync(): Promise<Auth> {
  if (cachedAuth) return cachedAuth
  if (authPromise) return authPromise

  authPromise = (async () => {
    try {
      const creds = await getFirebaseCredentials()
      const privateKey = normalizePrivateKey(creds.privateKey)

      if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        const preview = privateKey.substring(0, 50)
        logger.error('Invalid Firebase private key format (async)', {
          preview,
          hasNewlines: privateKey.includes('\n'),
          hasEscapedNewlines: creds.privateKey.includes('\\n'),
          length: privateKey.length,
        })
        throw new Error(
          'FIREBASE_PRIVATE_KEY format is invalid. Must be a valid PEM-encoded private key.'
        )
      }

      const app =
        getApps()[0] ??
        initializeApp({
          credential: cert({
            projectId: creds.projectId,
            clientEmail: creds.clientEmail,
            privateKey,
          }),
        })
      cachedAuth = getAuth(app)

      logger.debug('Firebase Admin inicializado (async)', {
        projectId: creds.projectId,
        clientEmailDomain: creds.clientEmail.split('@')[1],
      })

      return cachedAuth
    } catch (err) {
      logger.error('Firebase Admin async init failed', {
        error: err instanceof Error ? err.message : String(err),
        code:
          err instanceof Error && 'code' in err ? (err as any).code : undefined,
      })
      throw err
    }
  })().catch((err) => {
    authPromise = null
    throw err
  })

  return authPromise
}

// Tenta inicializar de forma síncrona (útil em dev e build). Em produção sem env vars, cai no caminho async.
cachedAuth = initSync()

export async function getAdminAuth(): Promise<Auth> {
  return initAsync()
}
