#!/usr/bin/env node
/**
 * Compara variáveis de ambiente entre arquivos .env locais e Netlify
 * Identifica quais variáveis estão faltando no Netlify
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

console.log('🔍 Comparando variáveis de ambiente...\n')

// Extrai variáveis dos arquivos .env locais
function extractEnvVars(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const vars = new Set()

    content.split('\n').forEach((line) => {
      // Ignora comentários e linhas vazias
      if (line.trim().startsWith('#') || !line.trim()) return

      // Extrai nome da variável (antes do =)
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=/)
      if (match) {
        vars.add(match[1])
      }
    })

    return vars
  } catch (error) {
    return new Set()
  }
}

// Pega variáveis do Netlify via CLI
function getNetlifyVars() {
  try {
    const output = execSync('netlify env:list --json', { encoding: 'utf-8' })
    const vars = JSON.parse(output)
    return new Set(Object.keys(vars))
  } catch (error) {
    console.error('❌ Erro ao obter variáveis do Netlify:', error.message)
    process.exit(1)
  }
}

// Arquivos para verificar (ordem de prioridade)
const envFiles = ['.env', '.env.production', '.env.local']

// Coleta todas as variáveis dos arquivos locais
const localVars = new Set()
const fileVars = new Map()

envFiles.forEach((file) => {
  const filePath = resolve(process.cwd(), file)
  const vars = extractEnvVars(filePath)

  if (vars.size > 0) {
    fileVars.set(file, vars)
    vars.forEach((v) => localVars.add(v))
    console.log(`✓ ${file}: ${vars.size} variáveis`)
  }
})

console.log(`\n📦 Total de variáveis locais: ${localVars.size}`)

// Pega variáveis do Netlify
const netlifyVars = getNetlifyVars()
console.log(`☁️  Total de variáveis no Netlify: ${netlifyVars.size}\n`)

// Variáveis que devem ser ignoradas (não necessárias no Netlify)
const ignoreVars = new Set([
  'FIREBASE_PRIVATE_KEY', // Movido para Netlify Blobs
  'FIREBASE_CLIENT_EMAIL', // Movido para Netlify Blobs
  'TEST_STDIN', // Apenas para testes locais
  'SMTP_HOST', // Email via Resend, não SMTP
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_SECURE',
  'SMTP_FROM',
  'ADMIN_API_TOKEN', // Específico para ambiente local
  'NETLIFY_SITE_ID', // Injetado automaticamente pelo Netlify
  'NETLIFY_AUTH_TOKEN', // Apenas para CLI local
])

// Variáveis extras no Netlify (que não estão nos .env locais)
const extraInNetlify = new Set()
netlifyVars.forEach((v) => {
  if (!localVars.has(v)) {
    extraInNetlify.add(v)
  }
})

// Variáveis faltando no Netlify
const missingInNetlify = new Set()
localVars.forEach((v) => {
  if (!netlifyVars.has(v) && !ignoreVars.has(v)) {
    missingInNetlify.add(v)
  }
})

// Relatório
console.log('─'.repeat(70))
console.log('📊 RELATÓRIO DE COMPARAÇÃO')
console.log('─'.repeat(70))

if (missingInNetlify.size > 0) {
  console.log('\n❌ Variáveis FALTANDO no Netlify:')
  console.log('─'.repeat(70))

  const sortedMissing = Array.from(missingInNetlify).sort()
  sortedMissing.forEach((varName, index) => {
    // Encontra em qual arquivo está definida
    const foundIn = []
    fileVars.forEach((vars, file) => {
      if (vars.has(varName)) foundIn.push(file)
    })

    console.log(`${index + 1}. ${varName}`)
    console.log(`   📁 Definida em: ${foundIn.join(', ')}`)
  })

  console.log('\n💡 Para adicionar ao Netlify:')
  console.log('   netlify env:set VARIAVEL "valor"')
  console.log(
    '   ou via Dashboard: https://app.netlify.com/sites/mygest/settings/env'
  )
} else {
  console.log('\n✅ Todas as variáveis necessárias estão no Netlify!')
}

if (extraInNetlify.size > 0) {
  console.log('\n📋 Variáveis EXTRAS no Netlify (não em .env locais):')
  console.log('─'.repeat(70))

  const sortedExtra = Array.from(extraInNetlify).sort()
  sortedExtra.forEach((varName, index) => {
    console.log(`${index + 1}. ${varName}`)
  })
}

if (ignoreVars.size > 0) {
  console.log('\n🔕 Variáveis ignoradas (não necessárias no Netlify):')
  console.log('─'.repeat(70))

  const sortedIgnored = Array.from(ignoreVars).sort()
  sortedIgnored.forEach((varName, index) => {
    console.log(`${index + 1}. ${varName}`)
  })
}

console.log('\n' + '─'.repeat(70))
console.log('📈 RESUMO:')
console.log('─'.repeat(70))
console.log(`  Variáveis locais:          ${localVars.size}`)
console.log(`  Variáveis no Netlify:      ${netlifyVars.size}`)
console.log(`  Faltando no Netlify:       ${missingInNetlify.size}`)
console.log(`  Extras no Netlify:         ${extraInNetlify.size}`)
console.log(`  Ignoradas:                 ${ignoreVars.size}`)
console.log('─'.repeat(70))

// Exit code baseado em resultado
if (missingInNetlify.size > 0) {
  console.log(
    '\n⚠️  Ação necessária: Adicione as variáveis faltantes ao Netlify'
  )
  process.exit(1)
} else {
  console.log('\n✅ Configuração OK!')
  process.exit(0)
}
