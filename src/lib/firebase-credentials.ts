/**
 * Carrega credenciais Firebase de forma otimizada
 * 1. Tenta carregar do Netlify Blobs (produção)
 * 2. Fallback para variáveis de ambiente
 */

import { getStore } from '@netlify/blobs'

export interface FirebaseCredentials {
  projectId: string
  clientEmail: string
  privateKey: string
}

let cachedCredentials: FirebaseCredentials | null = null

export async function getFirebaseCredentials(): Promise<FirebaseCredentials> {
  // Cache em memória para reutilizar durante o mesmo cold start
  if (cachedCredentials) {
    return cachedCredentials
  }

  // Opção 1: Variáveis de ambiente (sempre disponível, fallback seguro)
  const envCreds: FirebaseCredentials = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  }

  // Se todas env vars existem, use direto (desenvolvimento ou produção com env vars)
  if (envCreds.projectId && envCreds.clientEmail && envCreds.privateKey) {
    cachedCredentials = envCreds
    return envCreds
  }

  // Opção 2: Netlify Blobs (produção otimizada - economiza 1.7KB de env vars)
  try {
    const store = getStore('firebase-secrets')

    const [projectId, clientEmail, privateKey] = await Promise.all([
      store.get('project_id', { type: 'text' }),
      store.get('client_email', { type: 'text' }),
      store.get('private_key', { type: 'text' }),
    ])

    if (projectId && clientEmail && privateKey) {
      cachedCredentials = { projectId, clientEmail, privateKey }
      return cachedCredentials
    }
  } catch (error) {
    // Netlify Blobs não disponível ou não configurado
    console.warn('Netlify Blobs não disponível, usando env vars', error)
  }

  // Se chegou aqui, nem env vars nem blobs funcionaram
  throw new Error(
    'Firebase credentials não encontradas. Configure FIREBASE_* env vars ou use Netlify Blobs.'
  )
}

/**
 * Versão síncrona - APENAS para uso com env vars
 * Use getFirebaseCredentials() (async) sempre que possível
 */
export function getFirebaseCredentialsSync(): FirebaseCredentials {
  if (cachedCredentials) {
    return cachedCredentials
  }

  const creds: FirebaseCredentials = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  }

  if (!creds.projectId || !creds.clientEmail || !creds.privateKey) {
    throw new Error(
      'Firebase credentials não disponíveis. Use getFirebaseCredentials() async ou configure env vars.'
    )
  }

  cachedCredentials = creds
  return creds
}
