import { getClientEnv, validateClientEnv } from '@/lib/env'
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app'
import { Auth, getAuth, GoogleAuthProvider } from 'firebase/auth'
import { Firestore, getFirestore } from 'firebase/firestore'

// Evita crash durante SSR (Next.js avalia módulos client-side no build)
const isClient = typeof window !== 'undefined'

// Configuração do Firebase
const cenv = getClientEnv()
const v = validateClientEnv(cenv)
const firebaseConfig = {
  apiKey: cenv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: cenv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: cenv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: cenv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: cenv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: cenv.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Inicialização condicional — só no cliente
let firebaseApp: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined
let provider: GoogleAuthProvider | undefined

if (isClient) {
  if (!v.ok) {
    console.warn(`⚠️ Missing Firebase env vars: ${v.missing.join(', ')}`)
  }
  // Type refinement: ensure all required properties are present before init
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  ) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
    db = getFirestore(firebaseApp)
    auth = getAuth(firebaseApp)
    provider = new GoogleAuthProvider()
  } else {
    // Avoid throwing to keep dev experience smoother; initialization will be skipped.
    console.warn(
      '⚠️ Firebase initialization skipped due to missing critical env vars.'
    )
  }
}

export { auth, db, firebaseApp, provider }
