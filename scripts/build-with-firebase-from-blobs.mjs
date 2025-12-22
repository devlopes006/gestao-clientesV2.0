import { getStore } from '@netlify/blobs'
import { spawn } from 'node:child_process'

async function loadFirebaseSecrets() {
  try {
    const store = getStore('firebase-secrets')

    // Carrega each blob directly
    const projectIdBlob = await store.get('project_id')
    const clientEmailBlob = await store.get('client_email')
    const privateKeyBlob = await store.get('private_key')

    const projectId = projectIdBlob ? await projectIdBlob.text() : null
    const clientEmail = clientEmailBlob ? await clientEmailBlob.text() : null
    const privateKey = privateKeyBlob ? await privateKeyBlob.text() : null

    if (!clientEmail || !privateKey) {
      console.warn(
        '[build] Firebase secrets not found in blobs; will rely on env fallback'
      )
      return {}
    }

    return {
      FIREBASE_PROJECT_ID:
        projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: clientEmail,
      FIREBASE_PRIVATE_KEY: privateKey,
    }
  } catch (err) {
    console.warn(
      '[build] Failed to load Firebase secrets from blobs; will rely on env fallback'
    )
    console.warn(err)
    return {}
  }
}

async function main() {
  const firebaseEnv = await loadFirebaseSecrets()
  const child = spawn('node', ['scripts/netlify-build-with-guard.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, ...firebaseEnv },
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
    } else {
      process.exit(code ?? 1)
    }
  })
}

main().catch((err) => {
  console.error('[build] Unexpected error:', err)
  process.exit(1)
})
