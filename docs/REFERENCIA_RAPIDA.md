# 🔖 REFERÊNCIA RÁPIDA

## ⚡ URLs Importantes

### Seu Projeto LP (Produção)

```
https://lp-conversaoextrema-esther.vercel.app
```

### Dashboards

```
Vercel: https://vercel.com/dashboard
Netlify: https://app.netlify.com
GitHub: [seu-repositorio]
```

### Seu Site Gestão

```
Dev:        http://localhost:3001
Produção:   https://seu-site.netlify.app
Mensagens:  https://seu-site.netlify.app/messages
Webhook:    https://seu-site.netlify.app/api/integrations/whatsapp/webhook
```

---

## 🔐 Variáveis

### Copie/Cole - Vercel (LP)

```
GESTAO_CLIENTES_WEBHOOK_URL
https://seu-site-gestao.netlify.app/api/integrations/whatsapp/webhook

WHATSAPP_WEBHOOK_SECRET
gestao-clientes-webhook-secret-2025
```

### Copie/Cole - Netlify (Gestão)

```
WHATSAPP_WEBHOOK_SECRET
gestao-clientes-webhook-secret-2025
```

---

## 📝 Código Para LP

Coloque após salvar mensagem:

```typescript
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

    const response = await fetch(gestaoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: payload,
    })

    if (response.ok) {
      console.log('[Webhook] ✅ Encaminhado para Gestão')
    } else {
      console.error('[Webhook] ❌ Erro:', response.status)
    }
  } catch (error) {
    console.error('[Webhook] Erro:', error)
  }
}
```

---

## 🧪 Teste Manual (cURL)

### Testar Webhook

```bash
curl -X POST https://seu-site-gestao.netlify.app/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "from": "5548991964517",
    "name": "Teste",
    "type": "text",
    "text": "teste",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

Deve retornar:

```json
{ "received": true }
```

### Testar Mensagens (GET)

```bash
curl https://seu-site-gestao.netlify.app/api/integrations/whatsapp/messages
```

### Testar Envio (POST)

```bash
curl -X POST https://seu-site-gestao.netlify.app/api/integrations/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+5548991964517",
    "body": "Olá! Testando"
  }'
```

---

## 📋 Checklist Rápido

- [ ] Adicionar 2 vars Vercel
- [ ] Adicionar código LP
- [ ] Git push LP
- [ ] Adicionar 1 var Netlify
- [ ] Redeploy Vercel
- [ ] Redeploy Netlify
- [ ] Testar mensagem WhatsApp
- [ ] Ver em /messages
- [ ] Responder
- [ ] Receber resposta

---

## 🚨 Troubleshooting Rápido

| Problema              | Solução                                  |
| --------------------- | ---------------------------------------- |
| Mensagem não aparece  | Verificar logs Vercel (Functions → Logs) |
| Erro de assinatura    | Confirmar secrets são IGUAIS             |
| 404 no webhook        | Confirmar URL está correta               |
| Redeploy não funciona | Limpar cache, fazer novo deploy          |

---

## 📞 Logs Importantes

### Vercel (LP) - Procure por:

```
[Webhook] Encaminhando para Gestão
[Webhook] ✅ Encaminhado
[Webhook] ❌ Erro
```

### Netlify (Gestão) - Procure por:

```
[WhatsApp Webhook] Event: message
[WhatsApp Webhook] Message saved
[WhatsApp Webhook] Invalid signature
```

---

## ⏱️ Tempo Estimado

```
Vercel:         5 min
Código LP:     10 min
Netlify:        5 min
Redeploy:      10 min
Teste:          5 min
────────────────────
TOTAL:         30 min
```

---

## 🎯 Passo 1 (Agora)

1. Abra: https://vercel.com/dashboard
2. Clique: lp-conversaoextrema-esther
3. Settings → Environment Variables
4. Add: GESTAO_CLIENTES_WEBHOOK_URL
5. Add: WHATSAPP_WEBHOOK_SECRET
6. Redeploy

---

## 📚 Docs Relacionados

- [`INICIO_RAPIDO.md`](INICIO_RAPIDO.md) - Guia passo-a-passo
- [`TESTAR_COM_LP_PRODUCAO.md`](TESTAR_COM_LP_PRODUCAO.md) - Detalhes
- [`INTERFACE_MESSAGES.md`](INTERFACE_MESSAGES.md) - Interface
- [`COMECE_AQUI.md`](COMECE_AQUI.md) - Visão geral

---

**Tudo que você precisa em uma página! 👍**
