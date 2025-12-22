#!/usr/bin/env node
/**
 * Quick script to check DATABASE_URL across environments
 */

import { config } from 'dotenv'
import { resolve } from 'path'

console.log('🔍 Checking DATABASE_URL configuration...\n')

// Load different env files
const envLocal = config({ path: resolve(process.cwd(), '.env.local') })
const envProd = config({ path: resolve(process.cwd(), '.env.production') })
const envDefault = config({ path: resolve(process.cwd(), '.env') })

console.log('📁 .env.local DATABASE_URL:')
console.log(
  envLocal.parsed?.DATABASE_URL?.substring(0, 60) + '...' || 'Not set'
)

console.log('\n📁 .env.production DATABASE_URL:')
console.log(envProd.parsed?.DATABASE_URL?.substring(0, 60) + '...' || 'Not set')

console.log('\n📁 .env DATABASE_URL:')
console.log(
  envDefault.parsed?.DATABASE_URL?.substring(0, 60) + '...' || 'Not set'
)

console.log('\n🌐 Current process.env.DATABASE_URL:')
console.log(process.env.DATABASE_URL?.substring(0, 60) + '...' || 'Not set')

console.log('\n✅ All URLs should point to production Neon DB')
console.log(
  '   Expected host: ep-spring-glade-acb51twk-pooler.sa-east-1.aws.neon.tech'
)
