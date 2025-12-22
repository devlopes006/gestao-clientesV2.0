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
    let creds: ReturnType<typeof getFirebaseCredentialsSync> | null = null

    // Durante build-time: precisa de env vars
    // Durante runtime: tenta Blobs primeiro (async), mas firebaseAdmin.ts é sync
    // Solução: usar env vars quando disponíveis (build), confiar em Blobs para runtime via getFirebaseCredentials async
    try {
      creds = getFirebaseCredentialsSync()
    } catch (err) {
      // Em runtime sem env vars, isso vai falhar - mas está OK porque as funções
      // que precisam de Firebase devem usar getFirebaseCredentials() async do firebase-credentials.ts
      if (process.env.NODE_ENV === 'production') {
        // Em produção, deixa falhar silenciosamente - as funções que precisam usarão async
        console.warn(
          'Firebase Admin não inicializado (esperado em produção sem env vars). Use getFirebaseCredentials() async.'
        )
        // Exporta um stub que vai falhar se alguém tentar usar
        process.env._FIREBASE_NOT_INITIALIZED = 'true'
        throw err
      }
      throw err
    }

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
    // Se estamos em build, isso é erro sério
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `Firebase Admin não inicializado. Variáveis faltando: ${
          missing.join(', ') || 'desconhecidas'
        }\n` +
          'Defina-as em .env.local ou configure Netlify Blobs. Erro: ' +
          (error instanceof Error ? error.message : String(error))
      )
    }
    // Em produção, deixa continuar - vai falhar se alguma função tentar usar
    console.error('Firebase Admin init failed:', error)
  }
}

export const adminAuth = getAuth(getApp())
