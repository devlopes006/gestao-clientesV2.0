# 🔍 Troubleshooting - Webhook Não Está Chegando

## 📋 Checklist Diagnóstico

### 1️⃣ **Verificar Vercel (LP)**

```bash
# Abra: https://vercel.com/dashboard
# Clique: seu projeto LP
# Vá em: Settings → Environment Variables

Procure por:
✓ GESTAO_CLIENTES_WEBHOOK_URL = https://seu-site-gestao.netlify.app/api/integrations/whatsapp/webhook
✓ WHATSAPP_WEBHOOK_SECRET = gestao-clientes-webhook-secret-2025
```

Se não tiver, adicione e faça **Redeploy**!

---

### 2️⃣ **Verificar Netlify (Gestão)**

```bash
# Abra: https://app.netlify.com
# Clique: seu site Gestão
# Vá em: Settings → Environment

Procure por:
✓ WHATSAPP_WEBHOOK_SECRET = gestao-clientes-webhook-secret-2025
```

Se não tiver, adicione e faça **Trigger deploy**!

---

### 3️⃣ **Verificar Logs da LP (Vercel)**

1. Vercel Dashboard → Seu projeto LP
2. **Deployments** → Clique no deploy atual
3. **Logs** → procure por `[Webhook LP]` ou `Encaminhando para Gestão`

**Procure por:**

- ✅ `[Webhook LP] Encaminhando para Gestão Clientes...` = Tá tentando enviar
- ❌ `[Webhook LP] Erro ao encaminhar` = URL ou secret errado
- ❌ Nada = Código de encaminhamento não foi deployado

---

### 4️⃣ **Verificar Logs da Gestão (Netlify)**

1. Netlify Dashboard → Seu site Gestão
2. **Deployments** → Clique no deploy recente
3. **Deploy log** → procure por `[WhatsApp Webhook]`

**Procure por:**

- ✅ `[WhatsApp Webhook] Event: message` = Recebeu!
- ✅ `[WhatsApp Webhook] Message saved to database` = Salvou!
- ❌ `[WhatsApp Webhook] Invalid signature` = Secret diferente
- ❌ Nada = Webhook nunca chegou na Gestão

---

## 🔧 Teste Rápido (Dev)

Se estiver com Gestão rodando localmente em `localhost:3000`:

```bash
curl -X POST http://localhost:3000/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "data": {
      "id": "test-123",
      "from": "+5541999887766",
      "text": "Teste",
      "name": "Teste",
      "timestamp": '$(date +%s)'000
    }
  }'
```

**Esperado:**

```json
{ "received": true }
```

Se retornar erro, há um problema no endpoint ou no banco.

---

## ⚠️ Problemas Comuns

### Problema: "Invalid signature" (Erro 401)

**Causa:** Secret diferente entre LP e Gestão

**Solução:**

1. Vercel LP: `WHATSAPP_WEBHOOK_SECRET` = `gestao-clientes-webhook-secret-2025`
2. Netlify Gestão: `WHATSAPP_WEBHOOK_SECRET` = `gestao-clientes-webhook-secret-2025`
3. **Devem ser IDÊNTICOS!**

---

### Problema: "Connection refused" ou "404"

**Causa:** URL da Gestão incorreta ou site offline

**Solução:**

1. Verifique se a URL é válida: https://seu-site-gestao.netlify.app/api/integrations/whatsapp/webhook
2. Teste direto no navegador (deve dar erro 405 ou 401, nunca 404)
3. Se der 404, o endpoint não existe

---

### Problema: Tudo parece certo mas não funciona

**Debugar LP:**

```bash
# Nos logs da LP, procure por:
console.log('[Webhook LP] Encaminhando para Gestão Clientes...')
console.log('[Webhook LP] URL:', gestaoUrl)
console.log('[Webhook LP] Secret:', secret ? 'CONFIGURADO' : 'VAZIO')
```

Se `secret: VAZIO`, as env vars não estão sendo lidas na Vercel!

---

## ✅ Checklist Final

- [ ] GESTAO_CLIENTES_WEBHOOK_URL está em Vercel?
- [ ] WHATSAPP_WEBHOOK_SECRET está em Vercel?
- [ ] WHATSAPP_WEBHOOK_SECRET está em Netlify?
- [ ] Valores são IDÊNTICOS em ambas?
- [ ] LP foi redeploy após adicionar variáveis?
- [ ] Gestão foi redeploy após adicionar variáveis?
- [ ] Logs da LP mostram tentativa de encaminhamento?
- [ ] Logs da Gestão mostram recebimento?
- [ ] Teste com curl funciona (localhost)?

---

## 🆘 Precisa de Ajuda?

**Compartilhe comigo:**

1. A URL exata da Gestão em Netlify
2. Os logs da LP (Vercel Deployments → Logs)
3. Os logs da Gestão (Netlify Deploy log)

Vou identificar o problema! 🚀
