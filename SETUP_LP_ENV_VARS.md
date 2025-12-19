# 📋 Configuração LP - Adicionar ao .env.production (Vercel)

Copie e cole estas 2 linhas no `.env.production` ou nas Environment Variables da Vercel:

```env
# ========================================
# 🔗 Integração com Gestão de Clientes
# ========================================

# URL do webhook de gestão (para encaminhar mensagens recebidas)
GESTAO_CLIENTES_WEBHOOK_URL="https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook"

# Secret compartilhado para validar webhook (HMAC)
# Deve ser o MESMO em ambos os sistemas!
WHATSAPP_WEBHOOK_SECRET="gestao-clientes-webhook-secret-2025"
```

---

## 📝 Como Adicionar no Vercel

### Opção 1: Dashboard Vercel

1. Acesse: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto da LP
3. Vá em **Settings** → **Environment Variables**
4. Clique **Add Variable**
5. Preencha:
   - **Name:** `GESTAO_CLIENTES_WEBHOOK_URL`
   - **Value:** `https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook`
   - **Environments:** Production (mínimo)
6. Clique **Save**
7. Repita para `WHATSAPP_WEBHOOK_SECRET` com valor `gestao-clientes-webhook-secret-2025`
8. Clique **Deployments** → Selecione o deploy atual → **Redeploy**

### Opção 2: Vercel CLI

```bash
# Instalar (se não tiver)
npm i -g vercel

# Adicionar variáveis
vercel env add GESTAO_CLIENTES_WEBHOOK_URL
# Cole: https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook

vercel env add WHATSAPP_WEBHOOK_SECRET
# Cole: gestao-clientes-webhook-secret-2025

# Redeploy
vercel --prod
```

---

## 🔧 Código a Adicionar na LP

### Arquivo: `/api/whatsapp/webhook.ts`

Após a linha que salva a mensagem localmente, adicione este bloco:

```typescript
// ============================================
// 🆕 ENCAMINHAR PARA GESTÃO CLIENTES
// ============================================

const gestaoUrl = process.env.GESTAO_CLIENTES_WEBHOOK_URL
const secret = process.env.WHATSAPP_WEBHOOK_SECRET

if (gestaoUrl) {
  try {
    const payload = JSON.stringify({
      event: 'message',
      from: phone,
      name: profile?.name || 'Cliente WhatsApp',
      type: 'text',
      text: messageText,
      timestamp: new Date().toISOString(),
    })

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Adicionar assinatura HMAC se secret estiver configurado
    if (secret) {
      const crypto = await import('crypto')
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')
      headers['X-Signature'] = signature
    }

    // Encaminhar para Gestão Clientes
    const gestaoResponse = await fetch(gestaoUrl, {
      method: 'POST',
      headers,
      body: payload,
    })

    if (gestaoResponse.ok) {
      console.log('[Webhook] ✅ Mensagem encaminhada para Gestão Clientes')
    } else {
      console.error('[Webhook] ⚠️ Erro ao encaminhar:', gestaoResponse.status)
    }
  } catch (error) {
    console.error('[Webhook] ⚠️ Erro ao encaminhar para Gestão:', error)
    // Não falhar o webhook por isso - mensagem já foi salva localmente
  }
}
```

---

## 📊 Checklist Final

- [ ] Adicionado `GESTAO_CLIENTES_WEBHOOK_URL` na Vercel
- [ ] Adicionado `WHATSAPP_WEBHOOK_SECRET` na Vercel
- [ ] Código de encaminhamento adicionado em `/api/whatsapp/webhook.ts`
- [ ] Redeploy executado na Vercel
- [ ] Testado com mensagem real no WhatsApp
- [ ] Mensagem apareceu na interface `/messages` da Gestão
- [ ] Admin conseguiu responder

---

## 🧪 Teste

Após fazer tudo acima:

1. Envie mensagem no WhatsApp para `5548991964517`
2. Fluxo esperado:

   ```
   WhatsApp → Meta Cloud API
      ↓
   LP /api/whatsapp/webhook (recebe)
      ↓
   LP encaminha para Gestão
      ↓
   Gestão /api/integrations/whatsapp/webhook (cria lead)
      ↓
   Aparece em https://seu-app-gestao.netlify.app/messages
   ```

3. Clique na conversa e responda - deve chegar no cliente

---

**URL para copiar (substitua pelo seu domínio):**

```
https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook
```

Se usar Netlify Deploy Preview:

```
https://deploy-preview-XX--seu-site.netlify.app/api/integrations/whatsapp/webhook
```
