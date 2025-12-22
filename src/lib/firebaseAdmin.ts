import {
  getFirebaseCredentials,
  getFirebaseCredentialsSync,
} from '@/lib/firebase-credentials'
import { logger } from '@/lib/logger'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

let cachedAuth: Auth | null = null
let authPromise: Promise<Auth> | null = null

function buildCredentialArgs() {
  const creds = getFirebaseCredentialsSync()
  return {
    projectId: creds.projectId,
    clientEmail: creds.clientEmail,
    privateKey: creds.privateKey.replace(/\\n/g, '\n'),
  }
}

function initSync(): Auth | null {
  try {
    const { projectId, clientEmail, privateKey } = buildCredentialArgs()
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      logger.warn(
        'FIREBASE_PRIVATE_KEY parece inválida (não contém BEGIN PRIVATE KEY). Verifique se as quebras de linha estão escapadas como \\n.'
      )
    }

    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    cachedAuth = getAuth(app)
    return cachedAuth
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      throw error instanceof Error ? error : new Error(String(error))
    }
    logger.warn('Firebase Admin sync init falhou; tentando async', {
      message: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

async function initAsync(): Promise<Auth> {
  if (cachedAuth) return cachedAuth
  if (authPromise) return authPromise

  authPromise = (async () => {
    const creds = await getFirebaseCredentials()
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: creds.projectId,
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey.replace(/\\n/g, '\n'),
        }),
      })
    cachedAuth = getAuth(app)
    return cachedAuth
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
