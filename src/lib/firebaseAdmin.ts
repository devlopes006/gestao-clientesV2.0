import { getFirebaseCredentialsSync } from '@/lib/firebase-credentials'
import { logger } from '@/lib/logger'
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Helper to build a clearer error message listing missing envs.
function assertServerEnv() {
  const raw = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  }
  const missing = Object.entries(raw)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  return { raw, missing }
}

if (!getApps().length) {
  try {
    // Tenta carregar credentials (Netlify Blobs ou env vars)
    const creds = getFirebaseCredentialsSync()

    const privateKey = creds.privateKey.replace(/\\n/g, '\n')
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      logger.warn(
        'FIREBASE_PRIVATE_KEY parece inválida (não contém BEGIN PRIVATE KEY). Verifique se as quebras de linha estão escapadas como \\n.'
      )
    }

    initializeApp({
      credential: cert({
        projectId: creds.projectId,
        clientEmail: creds.clientEmail,
        privateKey,
      }),
    })

    // Log informativo apenas em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Firebase Admin inicializado', {
        projectId: creds.projectId,
        clientEmailDomain: creds.clientEmail?.split('@')[1],
        source: process.env.FIREBASE_PRIVATE_KEY ? 'env' : 'blobs',
      })
    }
  } catch (error) {
    const { missing } = assertServerEnv()
    throw new Error(
      `Firebase Admin não inicializado. Variáveis faltando: ${
        missing.join(', ') || 'desconhecidas'
      }\n` +
        'Defina-as em .env.local ou configure Netlify Blobs. Erro: ' +
        (error instanceof Error ? error.message : String(error))
    )
  }
}

export const adminAuth = getAuth(getApp())
