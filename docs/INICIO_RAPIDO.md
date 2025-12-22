# ⚡ INÍCIO RÁPIDO - 5 MINUTOS

## 🎯 Seu Objetivo

Conectar sua LP em produção (`https://lp-conversaoextrema-esther.vercel.app`) com sua Gestão Clientes para:

- Receber mensagens WhatsApp
- Visualizar em `/messages`
- Responder direto da interface
- Enviar via Meta Cloud API

---

## ✅ Status Atual

```
✅ Interface /messages          IMPLEMENTADA e PRONTA
✅ Webhook em /api/integrations/whatsapp/webhook    PRONTO
✅ API de mensagens            PRONTA
✅ Banco de dados              CRIADO
✅ Tudo testado localmente     FUNCIONANDO

⏳ Falta conectar com sua LP em produção
```

---

## 🚀 AÇÃO 1: Vercel Dashboard (5 min)

### 1. Abra Vercel

```
https://vercel.com/dashboard
```

### 2. Clique em: `lp-conversaoextrema-esther`

### 3. Vá para: **Settings → Environment Variables**

### 4. Adicione 2 Variáveis:

```
VARIÁVEL 1:
Nome: GESTAO_CLIENTES_WEBHOOK_URL
Valor: https://mygest.netlify.app/api/integrations/whatsapp/webhook
[Selecione: Production, Preview, Development]
Botão: Add

VARIÁVEL 2:
Nome: WHATSAPP_WEBHOOK_SECRET
Valor: gestao-clientes-webhook-secret-2025
[Selecione: Production, Preview, Development]
Botão: Add
```

**IMPORTANTE:** Substitua `SEU-SITE-NETLIFY` pela URL real do seu site no Netlify!

### 5. Clique: **Redeploy**

```
Deployments → Seu último deploy → 3 pontos → Redeploy
```

✅ **Pronto!** A LP agora tem as variáveis configuradas.

---

## 🚀 AÇÃO 2: Adicionar Código na LP (10 min)

### 1. Abra seu projeto LP local

```bash
cd seu-projeto-lp
```

### 2. Abra: `pages/api/whatsapp/webhook.ts` (ou similar)

### 3. Procure por onde você **salva a mensagem**

Exemplo:

```typescript
// Algo como:
await db.whatsappMessages.create({...})
// ou
await saveMessage(messageData)
```

### 4. **APÓS ISSO**, adicione este código:

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
      from: phoneNumber, // seu campo de telefone
      name: customerName || 'Cliente', // seu campo de nome
      type: 'text',
      text: messageText, // seu campo de mensagem
      timestamp: new Date().toISOString(),
    })

    const crypto = await import('crypto')
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    const response = await fetch(gestaoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: payload,
    })

    console.log('[Webhook] Encaminhado para Gestão:', response.ok ? '✅' : '❌')
  } catch (error) {
    console.error('[Webhook] Erro ao encaminhar:', error)
  }
}
```

### 5. Faça git push

```bash
git add .
git commit -m "feat: integrar com gestao-clientes"
git push origin main
```

✅ **Pronto!** A LP agora encaminha mensagens para a Gestão.

---

## 🚀 AÇÃO 3: Netlify Dashboard (5 min)

### 1. Abra Netlify

```
https://app.netlify.com
```

### 2. Clique em seu site Gestão Clientes

### 3. Vá para: **Site settings → Environment → Environment variables**

### 4. Clique: **Add variable**

```
Nome: WHATSAPP_WEBHOOK_SECRET
Valor: gestao-clientes-webhook-secret-2025
Clique: Save
```

### 5. Triggerar redeploy

```
Deploys → Trigger deploy → Deploy site
```

✅ **Pronto!** A Gestão agora tem o secret para validar mensagens.

---

## 📊 Resultado Final

Após esses 3 passos (20 minutos):

```
Cliente envia WhatsApp
        ↓
LP recebe via Meta Cloud API
        ↓
LP salva localmente
        ↓
LP encaminha para Gestão ✅ (novo!)
        ↓
Gestão valida + salva no banco
        ↓
Admin acessa /messages e VÊ a mensagem ✅
        ↓
Admin responde
        ↓
Gestão envia para LP
        ↓
LP envia via Meta Cloud API ✅
        ↓
Cliente recebe resposta ✅
```

---

## 🧪 Testar (5 min)

Após redeploy de ambas:

### 1. Envie mensagem WhatsApp real

```
Abra WhatsApp → Envie para seu número de negócio
Exemplo: "Olá! Testando integração"
```

### 2. Acesse a Gestão

```
https://seu-site-gestao.netlify.app
Faça login
```

### 3. Vá para /messages

```
https://seu-site-gestao.netlify.app/messages
```

### 4. Procure sua mensagem

```
Deve aparecer na lista de conversas
Clique para abrir
```

### 5. Responda

```
Digite sua resposta no campo
Clique "Enviar"
```

### 6. Verifique WhatsApp

```
A resposta deve chegar no seu telefone ✅
```

---

## ⚠️ Se Não Funcionar

### Checklist:

1. **A URL da Gestão está correta?**

   ```bash
   # Verifique em Vercel:
   GESTAO_CLIENTES_WEBHOOK_URL = https://SEU-SITE.netlify.app/api/integrations/whatsapp/webhook
   ```

2. **O Secret é EXATAMENTE igual?**

   ```bash
   # Vercel (LP):
   WHATSAPP_WEBHOOK_SECRET = gestao-clientes-webhook-secret-2025

   # Netlify (Gestão):
   WHATSAPP_WEBHOOK_SECRET = gestao-clientes-webhook-secret-2025

   # DEVEM SER IDÊNTICOS!
   ```

3. **Redeploy completou?**

   ```bash
   Vercel: Deployments → Status deve ser "Ready"
   Netlify: Published version deve ser recente
   ```

4. **Código foi adicionado na LP?**
   ```bash
   Verifique em seu repositório LP
   Procure por ENCAMINHAR PARA GESTÃO
   ```

---

## 📱 Links Importantes

```
Vercel Dashboard:
https://vercel.com/dashboard

Seu LP em Produção:
https://lp-conversaoextrema-esther.vercel.app

Netlify Dashboard:
https://app.netlify.com

Sua Gestão Interface:
https://seu-site.netlify.app/messages

GitHub:
https://github.com/seu-usuario/seu-repo
```

---

## ✅ Checklist Final

- [ ] Adicionou GESTAO_CLIENTES_WEBHOOK_URL no Vercel
- [ ] Adicionou WHATSAPP_WEBHOOK_SECRET no Vercel
- [ ] Redeploy LP completou
- [ ] Adicionou código de encaminhamento na LP
- [ ] Fez git push na LP
- [ ] Adicionou WHATSAPP_WEBHOOK_SECRET no Netlify
- [ ] Redeploy Gestão completou
- [ ] Enviou mensagem teste no WhatsApp
- [ ] Mensagem apareceu na Gestão ✅
- [ ] Respondeu e recebeu no WhatsApp ✅

---

## 🎉 Resultado

**INTEGRAÇÃO ATIVA E FUNCIONANDO!** 🚀

Suas mensagens WhatsApp agora:

- ✅ Chegam na LP
- ✅ São encaminhadas para Gestão
- ✅ Admin consegue visualizar e responder
- ✅ Cliente recebe respostas em tempo real

---

**Tempo total: ~30 minutos | Resultado: INTEGRAÇÃO COMPLETA!**

👉 **Comece pelas variáveis do Vercel!**
