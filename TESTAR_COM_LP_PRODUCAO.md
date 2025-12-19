# 🚀 Como Testar Com Sua LP em Produção

## ✅ Interface Já Está Implementada!

A interface `/messages` já existe e está **100% funcional**:

- ✅ Recebe mensagens da API
- ✅ Exibe conversa por telefone
- ✅ Auto-refresh a cada 8 segundos
- ✅ Permite responder mensagens
- ✅ Design completo com Tailwind CSS

---

## 🎯 Seu Cenário

**Landing Page:** https://lp-conversaoextrema-esther.vercel.app (PRODUÇÃO)  
**Gestão Clientes:** Seu app Netlify (DESENVOLVIMENTO/PRODUÇÃO)

---

## 📋 Checklist Para Conectar

### 1️⃣ Verificar Sua LP - Acessar Vercel

```
https://vercel.com/dashboard
```

Procure: `lp-conversaoextrema-esther`

---

### 2️⃣ Adicionar 2 Variáveis de Ambiente

**Settings → Environment Variables**

Adicione estas 2 variáveis:

```
Variável 1:
Nome: GESTAO_CLIENTES_WEBHOOK_URL
Valor: https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook
Ambientes: Production, Preview, Development

Variável 2:
Nome: WHATSAPP_WEBHOOK_SECRET
Valor: gestao-clientes-webhook-secret-2025
Ambientes: Production, Preview, Development
```

⚠️ **IMPORTANTE:**

- Substitua `seu-app-gestao.netlify.app` pela URL real da sua Gestão no Netlify
- O Secret deve ser EXATAMENTE: `gestao-clientes-webhook-secret-2025`

---

### 3️⃣ Verificar/Adicionar Código na LP

No seu arquivo `/api/whatsapp/webhook.ts` ou `/pages/api/whatsapp/webhook.ts`:

**Após salvar a mensagem localmente, adicione:**

```typescript
// ========================================
// ENCAMINHAR PARA GESTÃO CLIENTES
// ========================================

const gestaoUrl = process.env.GESTAO_CLIENTES_WEBHOOK_URL
const secret = process.env.WHATSAPP_WEBHOOK_SECRET

if (gestaoUrl && secret) {
  try {
    const payload = JSON.stringify({
      event: 'message',
      from: phoneNumber,
      name: customerName || 'Cliente',
      type: 'text',
      text: messageText,
      timestamp: new Date().toISOString(),
    })

    const crypto = await import('crypto')
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    console.log('[Webhook LP] Encaminhando para Gestão Clientes...')
    console.log('[Webhook LP] URL:', gestaoUrl)
    console.log('[Webhook LP] Payload:', payload)

    const response = await fetch(gestaoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: payload,
    })

    if (response.ok) {
      console.log('[Webhook LP] ✅ Mensagem encaminhada com sucesso')
      const result = await response.json()
      console.log('[Webhook LP] Resposta:', result)
    } else {
      console.error('[Webhook LP] ❌ Erro ao encaminhar:', response.status)
      console.error('[Webhook LP] Response:', await response.text())
    }
  } catch (error) {
    console.error(
      '[Webhook LP] Erro:',
      error instanceof Error ? error.message : error
    )
  }
}
```

---

### 4️⃣ Configurar Gestão Clientes (Netlify)

1. Abra: https://app.netlify.com
2. Selecione seu site Gestão Clientes
3. **Site settings → Environment → Environment variables**
4. Adicione:

```
Nome: WHATSAPP_WEBHOOK_SECRET
Valor: gestao-clientes-webhook-secret-2025
```

---

### 5️⃣ Fazer Redeploy

**Landing Page (Vercel):**

```bash
git add .
git commit -m "feat: integrar com gestao-clientes"
git push origin main
```

Ou via Vercel Dashboard: **Deployments → Redeploy**

**Gestão Clientes (Netlify):**

```bash
git add .env.production
git commit -m "feat: adicionar webhook secret"
git push origin develop
```

Ou via Netlify: **Deploys → Trigger deploy**

---

## 🧪 Testar

### Passo 1: Enviar Mensagem no WhatsApp Real

1. Abra WhatsApp
2. Envie mensagem para seu número de negócio
3. Exemplo: `Olá, teste de integração`

---

### 2️⃣ Verificar Logs na LP (Vercel)

1. Vá para: https://vercel.com/dashboard
2. Clique no projeto `lp-conversaoextrema-esther`
3. **Functions → Logs**
4. Procure por: `[Webhook LP] Encaminhando para Gestão Clientes`
5. Deve mostrar:
   ```
   [Webhook LP] ✅ Mensagem encaminhada com sucesso
   ```

---

### 3️⃣ Verificar na Gestão Clientes

1. Abra: `https://seu-app-gestao.netlify.app/messages`
2. Faça login (se necessário)
3. **A mensagem deve aparecer lá!**

---

## 🔍 Troubleshooting

### Mensagem não apareceu?

#### Verificar 1: URL está correta?

```bash
# No Vercel, variável GESTAO_CLIENTES_WEBHOOK_URL
# Deve ser: https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook

# Teste via curl (do seu terminal):
curl -X POST https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: test" \
  -d '{
    "event": "message",
    "from": "5548991964517",
    "name": "Teste",
    "type": "text",
    "text": "teste",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Deve retornar: {"received":true}
```

#### Verificar 2: Secret é igual?

```bash
# Landing Page (Vercel Settings)
WHATSAPP_WEBHOOK_SECRET = gestao-clientes-webhook-secret-2025

# Gestão Clientes (Netlify Settings)
WHATSAPP_WEBHOOK_SECRET = gestao-clientes-webhook-secret-2025

# DEVEM SER IDÊNTICOS!
```

#### Verificar 3: Logs na LP

```
https://vercel.com → seu projeto → Functions → Logs

Procure por erros como:
- "[Webhook LP] ❌ Erro ao encaminhar"
- "[Webhook LP] Erro: ECONNREFUSED"
- Problemas de assinatura
```

#### Verificar 4: Logs na Gestão (Netlify)

```
https://app.netlify.com → seu site → Logs

Procure por:
- "[WhatsApp Webhook] Event: message"
- "[WhatsApp Webhook] ❌ Invalid signature"
- "[WhatsApp Webhook] Message saved"
```

---

## 📊 Fluxo Completo

```
1. Cliente envia WhatsApp
   ↓
2. Meta Cloud API encaminha para LP webhook
   ↓
3. LP salva localmente
   ↓
4. LP encaminha para Gestão webhook ← AQUI É O NOVO!
   ↓
5. Gestão valida assinatura (HMAC)
   ↓
6. Cria lead (se novo)
   ↓
7. Salva mensagem no banco
   ↓
8. Admin acessa /messages e VÊ a mensagem ✅
   ↓
9. Admin responde
   ↓
10. Gestão chama LP /api/messages/send (proxy)
    ↓
11. LP envia via Meta Cloud API
    ↓
12. Cliente recebe resposta ✅
```

---

## ✅ Checklist

- [ ] Adicionou GESTAO_CLIENTES_WEBHOOK_URL no Vercel
- [ ] Adicionado WHATSAPP_WEBHOOK_SECRET no Vercel
- [ ] Adicionou código de encaminhamento na LP
- [ ] Fez git push na LP
- [ ] Vercel redeploy completou
- [ ] Adicionou WHATSAPP_WEBHOOK_SECRET no Netlify Gestão
- [ ] Netlify redeploy completou
- [ ] Enviou mensagem real no WhatsApp
- [ ] Mensagem apareceu na Gestão /messages ✅
- [ ] Admin respondeu
- [ ] Resposta chegou no WhatsApp ✅

---

## 📝 Info das URLs

**Sua LP em produção:**

```
URL: https://lp-conversaoextrema-esther.vercel.app
Webhook: https://lp-conversaoextrema-esther.vercel.app/api/whatsapp/webhook
```

**Sua Gestão (substitua seu-app-gestao):**

```
URL: https://seu-app-gestao.netlify.app
Webhook: https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook
Interface: https://seu-app-gestao.netlify.app/messages
```

---

## 🎯 Estimativa

- Adicionar variáveis: **5 min**
- Adicionar código: **10 min**
- Redeploy: **10 min**
- Teste: **5 min**

**Total: ~30 minutos**

---

**Pronto? Comece pelas variáveis no Vercel! 🚀**
