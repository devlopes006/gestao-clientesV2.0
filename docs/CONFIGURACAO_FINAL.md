# 🚀 Configuração Final - WhatsApp Integration

## ✅ Status: Sistema 95% Pronto!

### O que já funciona:

- ✅ Interface `/messages` - linda e funcional
- ✅ Recebimento de mensagens via webhook
- ✅ Auto-criação de leads
- ✅ Salvamento no Postgres
- ✅ Endpoint de envio (proxy para LP)

---

## 📋 Checklist de Configuração

### 1. **Landing Page (Vercel)** ⚠️ FALTA CONFIGURAR

Adicione estas variáveis de ambiente na Vercel:

```env
# Webhook para encaminhar mensagens recebidas
GESTAO_CLIENTES_WEBHOOK_URL="https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook"

# Secret compartilhado (HMAC)
WHATSAPP_WEBHOOK_SECRET="MinhaChaveSecreta123!@#"
```

**Como adicionar:**

1. Vercel Dashboard → Seu projeto da LP
2. Settings → Environment Variables
3. Add new → Name: `GESTAO_CLIENTES_WEBHOOK_URL`, Value: `https://...`
4. Add new → Name: `WHATSAPP_WEBHOOK_SECRET`, Value: `sua-chave`
5. Deploy → Redeploy (para aplicar)

---

### 2. **Gestão Clientes (Netlify)** ⚠️ FALTA CONFIGURAR

Adicione estas variáveis de ambiente no Netlify:

```env
# Banco de dados (já deve estar configurado)
DATABASE_URL="postgresql://..."

# WhatsApp Integration
WHATSAPP_WEBHOOK_SECRET="MinhaChaveSecreta123!@#"  # MESMA da LP!
NEXT_PUBLIC_MESSAGES_GATEWAY="https://lp-conversaoextrema-esther.vercel.app"
```

**Como adicionar:**

1. Netlify Dashboard → Seu site
2. Site settings → Environment variables
3. Add a variable → Key: `WHATSAPP_WEBHOOK_SECRET`, Value: `sua-chave`
4. Add a variable → Key: `NEXT_PUBLIC_MESSAGES_GATEWAY`, Value: `https://lp-...`
5. Deploys → Trigger deploy

---

### 3. **Código da Landing Page** ⚠️ PRECISA ATUALIZAR

No arquivo `/api/whatsapp/webhook.ts` da LP, adicione o encaminhamento:

```typescript
// Após salvar a mensagem localmente
const message = {
  event: 'message',
  from: phone,
  name: profile?.name || 'Cliente',
  type: 'text',
  text: messageText,
  timestamp: new Date().toISOString(),
}

// Salvar local
await saveMessage(message)

// 🆕 ENCAMINHAR PARA GESTÃO CLIENTES
const gestaoUrl = process.env.GESTAO_CLIENTES_WEBHOOK_URL
const secret = process.env.WHATSAPP_WEBHOOK_SECRET

if (gestaoUrl) {
  try {
    const payload = JSON.stringify(message)

    // Gerar assinatura HMAC
    let headers = { 'Content-Type': 'application/json' }
    if (secret) {
      const crypto = require('crypto')
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')
      headers['X-Signature'] = signature
    }

    // Enviar para gestão
    await fetch(gestaoUrl, {
      method: 'POST',
      headers,
      body: payload,
    })

    console.log('[Webhook] Mensagem encaminhada para Gestão')
  } catch (error) {
    console.error('[Webhook] Erro ao encaminhar:', error)
    // Não falhar o webhook por isso
  }
}
```

---

## 🧪 Como Testar

### Teste Local (Dev)

1. **Inicie o servidor:**

```bash
pnpm dev
```

2. **Abra a interface:**

```
http://localhost:3000/messages
```

3. **Simule mensagem recebida:**

```bash
curl -X POST http://localhost:3000/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "from": "5541999887766",
    "name": "João Teste",
    "type": "text",
    "text": "Olá, vim da landing page!",
    "timestamp": "2025-12-19T18:00:00.000Z"
  }'
```

4. **Recarregue `/messages`** - deve ver a mensagem
5. **Clique na conversa** e tente responder

---

### Teste em Produção

1. **Configure as env vars** (passo 1 e 2 acima)

2. **Envie mensagem real no WhatsApp** para o número da LP

3. **Fluxo esperado:**

   ```
   Cliente → WhatsApp → Meta
     ↓
   LP recebe e processa
     ↓
   LP encaminha para Gestão
     ↓
   Gestão cria lead e salva
     ↓
   Aparece na interface /messages
   ```

4. **Responda na interface** → deve enviar via LP → Meta → Cliente

---

## 🐛 Troubleshooting

### Mensagem não aparece na interface

**Problema:** Cliente enviou, mas não aparece

**Verificar:**

1. LP recebeu do Meta? (logs da Vercel)
2. LP encaminhou para Gestão? (env `GESTAO_CLIENTES_WEBHOOK_URL` configurada?)
3. Gestão recebeu? (logs do Netlify, procure por "WhatsApp Webhook")
4. Erro de assinatura? (secret diferente entre LP e Gestão)
5. Tabela WhatsAppMessage existe? (`pnpm prisma studio`)

**Solução rápida:**

```bash
# Desabilitar verificação de assinatura temporariamente
# No .env da Gestão, comente:
# WHATSAPP_WEBHOOK_SECRET="..."

# Redeploy e teste
```

---

### Erro ao enviar mensagem

**Problema:** "Erro ao enviar" ao responder

**Verificar:**

1. `NEXT_PUBLIC_MESSAGES_GATEWAY` está correto?
2. LP tem endpoint `/api/messages/send`?
3. LP tem credenciais do Meta configuradas?
4. Número está em formato E.164? (+5541999998888)

**Teste direto:**

```bash
curl -X POST https://lp-conversaoextrema-esther.vercel.app/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5541999998888",
    "body": "Teste de envio"
  }'
```

---

### Interface não carrega mensagens

**Problema:** Tela fica carregando ou mostra erro

**Verificar:**

1. `NEXT_PUBLIC_MESSAGES_GATEWAY` configurado?
2. LP tem endpoint `/api/messages`?
3. CORS configurado na LP? (deve permitir origem da Gestão)

**Alternativa:** Buscar do banco local em vez da LP

No `/messages/page.tsx`, mude:

```typescript
const res = await fetch(`${GATEWAY}/api/messages?limit=200`)
// Para:
const res = await fetch(`/api/integrations/whatsapp/messages?limit=200`)
```

---

## 📊 Monitoramento

### Logs Importantes

**Landing Page (Vercel):**

```
[Webhook] Received WhatsApp message from...
[Webhook] Mensagem encaminhada para Gestão
[Send] Enviando mensagem via Meta Cloud API
```

**Gestão Clientes (Netlify):**

```
[WhatsApp Webhook] No secret configured - accepting...
[WhatsApp Webhook] Criando novo lead para: +55...
[WhatsApp Webhook] Lead criado com sucesso!
[WhatsApp Webhook] Message saved to database
```

---

## ✅ Checklist Final

Antes de considerar 100% pronto:

- [ ] Variáveis de ambiente configuradas na Vercel (LP)
- [ ] Variáveis de ambiente configuradas no Netlify (Gestão)
- [ ] Código de encaminhamento adicionado na LP
- [ ] Teste: Cliente envia → aparece na interface
- [ ] Teste: Admin responde → cliente recebe
- [ ] Tabela WhatsAppMessage existe no Postgres
- [ ] Interface `/messages` carrega sem erros
- [ ] CORS configurado (se necessário)

---

## 🎯 Próximos Passos (Opcional)

Melhorias futuras:

1. **Notificações em tempo real** (WebSocket ou SSE)
2. **Marcar mensagens como lidas**
3. **Busca de mensagens** (por texto, data, cliente)
4. **Templates de resposta rápida**
5. **Upload de mídia** (imagens, documentos)
6. **Histórico completo** no banco (não só cache da LP)
7. **Dashboard de métricas** (tempo médio de resposta, etc)

---

**Está quase tudo pronto! Só falta configurar as env vars e adicionar o código de encaminhamento na LP.**
