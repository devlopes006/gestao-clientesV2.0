# 🚀 Próximas Etapas - Ativar Integração em Produção

## 📋 Checklist Pronto Para Produção

Todos os testes passaram! ✅ Agora vamos conectar os dois sistemas para produção.

---

## 1️⃣ **LANDING PAGE** - Adicionar Variáveis (Vercel)

### Passo a Passo:

1. Abra [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em seu projeto da Landing Page
3. Settings → Environment Variables
4. Adicione estas 2 variáveis:

```
Variável 1:
Nome: GESTAO_CLIENTES_WEBHOOK_URL
Valor: https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook
Ambiente: Production, Preview, Development

Variável 2:
Nome: WHATSAPP_WEBHOOK_SECRET
Valor: gestao-clientes-webhook-secret-2025
Ambiente: Production, Preview, Development
```

### Confirmação:

```bash
# Confirme em Settings → Environment Variables
✓ GESTAO_CLIENTES_WEBHOOK_URL
✓ WHATSAPP_WEBHOOK_SECRET
```

---

## 2️⃣ **LANDING PAGE** - Adicionar Código de Encaminhamento

### Arquivo: `pages/api/whatsapp/webhook.ts` (ou `/api/whatsapp/webhook/route.ts`)

Após salvar a mensagem localmente, adicione este código:

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

    console.log('[Webhook] Encaminhando para Gestão Clientes...')

    const response = await fetch(gestaoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: payload,
    })

    if (response.ok) {
      console.log('[Webhook] ✅ Mensagem encaminhada com sucesso')
    } else {
      console.error('[Webhook] ❌ Erro ao encaminhar:', response.status)
    }
  } catch (error) {
    console.error(
      '[Webhook] Erro:',
      error instanceof Error ? error.message : error
    )
  }
}
```

### Localize no seu código:

```typescript
// Procure por algo como:
// "Salvando mensagem no banco"
// "Message saved"
// "SaveWhatsAppMessage"

// DEPOIS DISSO, ADICIONE O CÓDIGO ACIMA
```

### Teste Local:

```bash
# Se está em dev, teste se a variável existe:
echo $GESTAO_CLIENTES_WEBHOOK_URL
echo $WHATSAPP_WEBHOOK_SECRET

# Você deve ver os valores
```

---

## 3️⃣ **GESTÃO CLIENTES** - Adicionar Variável (Netlify)

### Passo a Passo:

1. Abra [Netlify Dashboard](https://app.netlify.com)
2. Clique em seu site Gestão Clientes
3. Site settings → Environment → Environment variables
4. Add variable

```
Nome: WHATSAPP_WEBHOOK_SECRET
Valor: gestao-clientes-webhook-secret-2025
```

### Confirmação:

```bash
# No terminal, dentro da pasta do projeto:
grep WHATSAPP_WEBHOOK_SECRET .env.production
# Deve mostrar: WHATSAPP_WEBHOOK_SECRET=gestao-clientes-webhook-secret-2025
```

---

## 4️⃣ **REDEPLOY** - Ambas Aplicações

### Landing Page (Vercel):

```bash
# Opção 1: Via Vercel (automático após commit)
git add .
git commit -m "feat: adicionar encaminhamento para gestao-clientes"
git push origin main

# Opção 2: Via CLI
vercel --prod

# Ou manualmente no Vercel Dashboard
# Settings → Redeploy
```

### Gestão Clientes (Netlify):

```bash
# Opção 1: Via Git (automático após commit)
git add .env.production
git commit -m "feat: configurar webhook secret"
git push origin develop

# Opção 2: Painel Netlify
# Deploys → Trigger deploy → Deploy site
```

---

## 5️⃣ **TESTAR** - Com Mensagem Real

### Teste Final:

1. **Abra seu WhatsApp pessoal**
   - Envie mensagem para seu número de negócio
   - Exemplo: `Olá, gostaria de mais informações`

2. **Verifique a Landing Page**
   - Vá para seu painel LP
   - Procure a mensagem em: `Mensagens` ou `Conversas`

3. **Verifique a Gestão Clientes**
   - Faça login
   - Acesse: `https://seu-app.netlify.app/messages`
   - A mensagem deve aparecer lá também!

4. **Responda via Gestão**
   - Clique na conversa
   - Digite sua resposta
   - Clique "Enviar"

5. **Verifique no WhatsApp**
   - A resposta deve chegar no seu telefone

---

## 📊 O Que Deve Acontecer

```
Cliente WhatsApp
      ↓
   ENVIAR
      ↓
Landing Page recebe
      ↓
LP salva localmente
      ↓
LP encaminha para Gestão
      ↓
Gestão recebe + valida assinatura
      ↓
Cria lead (se novo) + salva mensagem
      ↓
Admin vê em /messages
      ↓
Admin clica em "Responder"
      ↓
Gestão chama LP /api/messages/send
      ↓
LP envia via Meta Cloud API
      ↓
Cliente recebe resposta ✅
```

---

## 🔧 Troubleshooting Rápido

### Problema: Mensagem não aparece na Gestão

**Solução 1:** Verificar logs do LP

```bash
# Em Vercel, Functions logs:
Procure por: "[Webhook] Encaminhando para Gestão Clientes"
Ou procure por erro: "[Webhook] ❌ Erro ao encaminhar"
```

**Solução 2:** Verificar se URL está correta

```bash
# Teste em seu terminal:
curl -X POST https://seu-app-gestao.netlify.app/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
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

**Solução 3:** Verificar se Secret é igual

```bash
# Landing Page:
echo $WHATSAPP_WEBHOOK_SECRET

# Gestão Clientes (.env.production):
grep WHATSAPP_WEBHOOK_SECRET .env.production

# Devem ser EXATAMENTE IGUAIS
```

### Problema: Erro de Assinatura

**Significa:** Secret está diferente entre LP e Gestão

**Solução:**

1. Abra Vercel Dashboard → Variáveis da LP
2. Abra Netlify Dashboard → Variáveis da Gestão
3. Copie o valor de um para o outro (para ficar igual)
4. Redeploy

---

## ✅ Checklist Final

- [ ] GESTAO_CLIENTES_WEBHOOK_URL adicionado (Vercel)
- [ ] WHATSAPP_WEBHOOK_SECRET adicionado (Vercel)
- [ ] Código de encaminhamento adicionado (LP)
- [ ] WHATSAPP_WEBHOOK_SECRET adicionado (Netlify)
- [ ] LP redeploy executado
- [ ] Gestão redeploy executado
- [ ] Teste com mensagem real enviado
- [ ] Mensagem aparece na Gestão ✅
- [ ] Admin respondeu
- [ ] Resposta chegou no WhatsApp ✅

---

## 🎓 Informações Úteis

### Nomes de Variáveis

```
GESTAO_CLIENTES_WEBHOOK_URL     ← URL da Gestão
WHATSAPP_WEBHOOK_SECRET         ← Senha (deve ser igual nos 2 sistemas)
```

### URLs

```
Landing Page Webhook:
  POST https://seu-lp.vercel.app/api/whatsapp/webhook

Gestão Webhook:
  POST https://seu-gestao.netlify.app/api/integrations/whatsapp/webhook

Gestão Interface:
  https://seu-gestao.netlify.app/messages
```

### Portas Dev

```
LP local: http://localhost:3000
Gestão local: http://localhost:3001
```

---

## 📞 Suporte

Se algo não funcionar:

1. **Verificar logs:**
   - Vercel: Functions logs
   - Netlify: Builds & deploys → Logs

2. **Testar manualmente:**
   - Use curl para chamar endpoints
   - Verifique respostas

3. **Validar configuração:**
   - Confirme URLs
   - Confirme Secrets
   - Confirme redeploys

---

## 🚀 Resultado Esperado

Após completar tudo, você terá:

✅ **Landing Page** gerando leads  
✅ **Gestão Clientes** recebendo mensagens  
✅ **Admin** respondendo via interface  
✅ **Clientes** recebendo respostas no WhatsApp  
✅ **Histórico** completo em um só lugar

**Tudo integrado, sincronizado e automático!** 🎉

---

**Estimado:** 15-20 minutos  
**Dificuldade:** Fácil  
**Suporte:** Consulte os logs se tiver problemas
