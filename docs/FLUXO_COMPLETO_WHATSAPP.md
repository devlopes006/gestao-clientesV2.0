WHATSAPP_WEBHOOK_SECRET="MinhaChaveSecreta123"  (mesma!)# 🔄 Fluxo Completo - Integração WhatsApp

## Arquitetura

```
WhatsApp (Meta Cloud API)
    ↓
Landing Page (Vercel)
    ↓
Gestão Clientes (Netlify)
    ↓
Postgres (Neon)
```

---

## 📥 **Recebimento de Mensagens**

### 1️⃣ Cliente envia mensagem no WhatsApp

```
Cliente → WhatsApp → Meta Cloud API
```

### 2️⃣ Meta encaminha para Landing Page

```
POST https://lp-conversaoextrema-esther.vercel.app/api/whatsapp/webhook

{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5541999998888",
          "text": { "body": "Olá, quero saber mais" },
          "timestamp": "1703001234"
        }]
      }
    }]
  }]
}
```

**LP processa (/api/whatsapp/webhook.ts):**

- Valida evento do Meta
- Extrai dados (from, text, timestamp, name)
- Salva em `/tmp/data/messages.json` (cache temporário)
- **Encaminha para Gestão Clientes** ⬇️

### 3️⃣ LP encaminha para Gestão Clientes

```
POST https://seu-app.netlify.app/api/integrations/whatsapp/webhook
X-Webhook-Signature: <HMAC SHA-256>

{
  "event": "message",
  "from": "5541999998888",
  "name": "João Silva",
  "type": "text",
  "text": "Olá, quero saber mais",
  "timestamp": "2025-12-19T15:30:00.000Z"
}
```

**Gestão processa:**

- Valida assinatura HMAC (opcional em dev)
- Normaliza telefone: `+5541999998888`
- **Busca cliente no banco** ou **cria lead automaticamente**
- Salva em tabela `WhatsAppMessage` no Postgres
- Retorna `{ "received": true }`

---

## 📤 **Envio de Mensagens**

### 1️⃣ Admin responde na interface `/messages`

```
Interface Gestão Clientes
  ↓ POST http://localhost:3000/api/integrations/whatsapp/messages/send (INTERNO)
  ↓
```

### 2️⃣ Gestão chama API da Landing Page

```
POST https://lp-conversaoextrema-esther.vercel.app/api/messages/send

{
  "to": "+5541999998888",
  "body": "Olá! Como posso ajudar?"
}
```

**LP processa (/api/messages/send.ts):**

- Valida número
- Envia via WhatsApp Cloud API
- Retorna `{ "success": true, "messageId": "..." }`

### 3️⃣ Meta entrega para o cliente

```
Landing Page → Meta Cloud API → WhatsApp → Cliente
```

---

## 👁️ **Visualização de Mensagens**

### Interface `/messages` busca de 2 fontes:

#### Opção A: API Local (Postgres)

```
GET /api/integrations/whatsapp/messages?limit=100

Retorna mensagens salvas no banco da Gestão
```

#### Opção B: API da Landing Page (atual)

```
GET https://lp-conversaoextrema-esther.vercel.app/api/messages?limit=200

Retorna mensagens do cache da LP (/tmp/data/messages.json)
```

---

## ⚙️ Configuração

### Landing Page (Vercel)

```env
# WhatsApp Meta Cloud API
WHATSAPP_PHONE_NUMBER_ID="123456789"
WHATSAPP_ACCESS_TOKEN="EAAxxxx..."
WHATSAPP_VERIFY_TOKEN="seu-token-verificacao"

# Webhook para Gestão Clientes
GESTAO_CLIENTES_WEBHOOK_URL="https://seu-app.netlify.app/api/integrations/whatsapp/webhook"
WHATSAPP_WEBHOOK_SECRET="sua-chave-hmac-compartilhada"

# Número interno (recebe alertas)
INTERNAL_ALERT_NUMBER="+5541999999999"
```

### Gestão Clientes (Netlify)

```env
# Banco de dados
DATABASE_URL="postgresql://..."

# WhatsApp Integration
WHATSAPP_WEBHOOK_SECRET="sua-chave-hmac-compartilhada"  # Mesma da LP
NEXT_PUBLIC_MESSAGES_GATEWAY="https://lp-conversaoextrema-esther.vercel.app"
```

---

## 🧪 Teste Local

### 1. Simular recebimento de mensagem:

```bash
curl -X POST http://localhost:3000/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "from": "5541999887766",
    "name": "Teste Local",
    "type": "text",
    "text": "Mensagem de teste",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }'
```

### 2. Ver mensagens no banco:

```bash
pnpm prisma studio
# Abrir tabela WhatsAppMessage
```

### 3. Abrir interface:

```
http://localhost:3000/messages
```

---

## 🚀 Deploy em Produção

### 1. Landing Page

- ✅ Já configurada com Meta Cloud API
- ✅ Webhooks do Meta apontando para /api/whatsapp/webhook
- ⚠️ Configurar `GESTAO_CLIENTES_WEBHOOK_URL` nas env vars da Vercel
- ⚠️ Configurar `WHATSAPP_WEBHOOK_SECRET` (mesma em ambos os sistemas)

### 2. Gestão Clientes

- ✅ Banco Postgres (Neon) configurado
- ✅ Tabela WhatsAppMessage criada
- ✅ Interface /messages pronta
- ⚠️ Configurar `WHATSAPP_WEBHOOK_SECRET` no Netlify
- ⚠️ Confirmar `NEXT_PUBLIC_MESSAGES_GATEWAY` está correto

### 3. Meta Cloud API (Webhooks)

```
Callback URL: https://lp-conversaoextrema-esther.vercel.app/api/whatsapp/webhook
Verify Token: <seu-token>
Subscribe to: messages, message_status
```

---

## 📊 Status Atual

### ✅ Implementado:

- [x] Webhook na Gestão (`/api/integrations/whatsapp/webhook`)
- [x] Auto-criação de leads (não precisa existir)
- [x] Normalização de telefones (+55, sem +, com parênteses)
- [x] Tabela WhatsAppMessage no Postgres
- [x] Interface `/messages` com Tailwind CSS
- [x] API local `/api/integrations/whatsapp/messages`
- [x] Middleware liberando rotas sem autenticação

### ⚠️ Falta Configurar:

- [ ] Variável `GESTAO_CLIENTES_WEBHOOK_URL` na LP (Vercel)
- [ ] Variável `WHATSAPP_WEBHOOK_SECRET` compartilhada
- [ ] Endpoint `/api/messages/send` na Gestão para chamar LP
- [ ] Testar fluxo completo em produção

### 🎯 Para Testar Agora:

1. Envie mensagem no WhatsApp para o número da LP
2. LP encaminha para Gestão automaticamente
3. Gestão cria lead e salva mensagem
4. Abra `/messages` na Gestão e veja a conversa
5. Responda (quando implementar envio)

---

## 📝 Notas Importantes:

1. **Cache Temporário:** LP usa `/tmp/data/messages.json` - dados podem ser perdidos em cold starts
2. **Fonte da Verdade:** Postgres na Gestão é o banco permanente
3. **Dual Storage:** Mensagens ficam em ambos os sistemas (LP cache + Gestão DB)
4. **Envio:** Apenas LP envia (tem as credenciais do Meta Cloud API)
5. **Segurança:** HMAC opcional em dev, obrigatório em produção
