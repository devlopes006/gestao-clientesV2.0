#!/usr/bin/env node

/**
 * Script de Teste Manual - Integração WhatsApp
 *
 * Este script simula o webhook da landing page e testa:
 * 1. Recebimento de mensagem
 * 2. Criação automática de lead
 * 3. Salvamento no banco
 */

const phoneNumber = '5541999887766'
const clientName = 'Maria Santos'
const message = 'Oi! Vim da landing page e quero saber mais sobre os serviços'

const payload = {
  event: 'message',
  messageId: `msg_test_${Date.now()}`,
  from: phoneNumber,
  name: clientName,
  type: 'text',
  text: message,
  timestamp: new Date().toISOString(),
}

console.log('🚀 Teste de Integração WhatsApp\n')
console.log(
  '📤 Enviando webhook para http://localhost:3000/api/integrations/whatsapp/webhook'
)
console.log('📱 De:', clientName, `(+${phoneNumber})`)
console.log('💬 Mensagem:', message)
console.log('')

fetch('http://localhost:3000/api/integrations/whatsapp/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
  .then((res) => res.json())
  .then((data) => {
    console.log('✅ Resposta do webhook:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')

    // Aguardar 1 segundo e buscar mensagens
    return new Promise((resolve) => setTimeout(resolve, 1000))
  })
  .then(() => {
    console.log('🔍 Buscando mensagens...')
    return fetch(
      'http://localhost:3000/api/integrations/whatsapp/messages?limit=10'
    )
  })
  .then((res) => res.json())
  .then((data) => {
    console.log(`✅ Encontradas ${data.messages?.length || 0} mensagens`)

    const ourMessage = data.messages?.find((m) => m.from === phoneNumber)
    if (ourMessage) {
      console.log('')
      console.log('✅ SUCESSO! Mensagem encontrada no banco:')
      console.log('  ID:', ourMessage.id)
      console.log('  De:', ourMessage.from)
      console.log('  Texto:', ourMessage.text)

      if (ourMessage.client) {
        console.log('')
        console.log('✅ Lead criado automaticamente:')
        console.log('  Cliente ID:', ourMessage.client.id)
        console.log('  Nome:', ourMessage.client.name)
        console.log('  Email:', ourMessage.client.email)
        console.log('  Telefone:', ourMessage.client.phone)
      }

      console.log('')
      console.log('🎉 INTEGRAÇÃO FUNCIONANDO!')
      console.log('')
      console.log('👉 Próximo passo: Abra http://localhost:3000/messages')
      console.log(`   Você deve ver a conversa com "${clientName}"`)
    } else {
      console.log('❌ Mensagem não encontrada no banco')
    }
  })
  .catch((err) => {
    console.error('❌ Erro:', err.message)
    console.log('')
    console.log('Certifique-se de que o servidor está rodando:')
    console.log('  pnpm dev')
  })
