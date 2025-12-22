#!/usr/bin/env node
/**
 * Script para fazer upload das credenciais Firebase para Netlify Blobs
 * Economiza ~1.7KB de variáveis de ambiente
 *
 * Uso:
 *   node scripts/upload-firebase-to-blobs.mjs
 *
 * Pré-requisitos:
 *   - Netlify CLI instalado: npm install -g netlify-cli
 *   - Autenticado: netlify login
 *   - Site linkado: netlify link
 */

import { getStore } from '@netlify/blobs'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Carrega env vars
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config()

async function uploadFirebaseCredentials() {
  console.log(
    '🔐 Fazendo upload das credenciais Firebase para Netlify Blobs...\n'
  )

  // Valida env vars
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Erro: Variáveis Firebase não encontradas em .env.local')
    console.error('   Certifique-se de ter:')
    console.error('   - NEXT_PUBLIC_FIREBASE_PROJECT_ID')
    console.error('   - FIREBASE_CLIENT_EMAIL')
    console.error('   - FIREBASE_PRIVATE_KEY')
    process.exit(1)
  }

  console.log('✓ Variáveis encontradas:')
  console.log(`  Project ID: ${projectId}`)
  console.log(`  Client Email: ${clientEmail}`)
  console.log(`  Private Key: ${privateKey.substring(0, 50)}...`)
  console.log()

  try {
    // Conecta ao Netlify Blobs
    const store = getStore({
      name: 'firebase-secrets',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
    })

    // Faz upload
    console.log('📤 Fazendo upload...')
    await Promise.all([
      store.set('project_id', projectId),
      store.set('client_email', clientEmail),
      store.set('private_key', privateKey),
    ])

    console.log('✅ Upload concluído com sucesso!\n')

    // Instruções pós-upload
    console.log('📋 Próximos passos:')
    console.log('1. No Netlify Dashboard, REMOVA estas variáveis de ambiente:')
    console.log('   • FIREBASE_PRIVATE_KEY')
    console.log('   • FIREBASE_CLIENT_EMAIL')
    console.log('   (Mantenha NEXT_PUBLIC_FIREBASE_PROJECT_ID)')
    console.log()
    console.log('2. Trigger novo deploy:')
    console.log(
      '   git commit --allow-empty -m "chore: use Firebase via Netlify Blobs"'
    )
    console.log('   git push origin master')
    console.log()
    console.log('💡 Economia estimada: ~1700 bytes de env vars')
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error)
    console.error()
    console.error('Certifique-se de:')
    console.error('1. Ter o Netlify CLI instalado: npm install -g netlify-cli')
    console.error('2. Estar autenticado: netlify login')
    console.error('3. Ter linkado o site: netlify link')
    console.error()
    console.error('Ou defina as variáveis manualmente:')
    console.error('  NETLIFY_SITE_ID=seu-site-id')
    console.error('  NETLIFY_AUTH_TOKEN=seu-token')
    process.exit(1)
  }
}

uploadFirebaseCredentials().catch((err) => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
