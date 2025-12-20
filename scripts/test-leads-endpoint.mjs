#!/usr/bin/env node
/**
 * Script para testar o endpoint /api/leads
 * Simula um envio da Landing Page
 */

import crypto from 'crypto'

const ENDPOINT = process.env.TEST_ENDPOINT || 'http://localhost:3000/api/leads'
const SECRET = process.env.WEBHOOK_SECRET || ''

// Dados de teste do lead
const leadData = {
  name: 'João Silva Teste',
  email: 'joao.teste@example.com',
  phone: '11999887766',
  plan: 'Premium',
  bestTime: 'Manhã',
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'test-campaign',
  origin: 'landing-page-test',
  timestamp: new Date().toISOString(),
}

const payload = JSON.stringify(leadData)

// Gerar assinatura HMAC se secret estiver configurado
let signature = ''
if (SECRET) {
  signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  console.log('🔐 Signature gerada:', signature)
} else {
  console.log('⚠️  WEBHOOK_SECRET não configurado - enviando sem assinatura')
}

console.log('\n📤 Enviando lead de teste...')
console.log('Endpoint:', ENDPOINT)
console.log('Dados:', leadData)
console.log('')

try {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (signature) {
    headers['x-signature'] = signature
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: payload,
  })

  const status = response.status
  const responseText = await response.text()

  console.log('Status:', status)
  console.log('Response:', responseText)

  if (status === 200 || status === 201) {
    const data = JSON.parse(responseText)
    console.log('\n✅ Lead enviado com sucesso!')
    console.log('Client ID:', data.clientId)
    console.log('Action:', data.action)
  } else {
    console.log('\n❌ Erro ao enviar lead')
    console.log('Detalhes:', responseText)
  }
} catch (error) {
  console.error('\n❌ Erro na requisição:', error.message)
  console.error(error)
}
