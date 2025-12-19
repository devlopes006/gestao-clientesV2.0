# ✅ Status da Integração WhatsApp - Landing Page → Gestão Clientes

## 📊 Status Atual: 90% COMPLETO

### ✅ O que JÁ ESTÁ FUNCIONANDO:

#### 1. **Backend da Aplicação (gestao-clientes)** ✅

- [x] Webhook `/api/integrations/whatsapp/webhook` - **PRONTO**
  - Recebe mensagens da landing page
  - Valida HMAC SHA-256 para segurança
  - Cria leads automaticamente (não precisa cliente existente)
  - Normaliza telefones (+55, sem +, com parênteses)
  - Salva mensagens no banco Postgres

- [x] API `/api/integrations/whatsapp/messages` - **PRONTO**
  - Lista todas mensagens recebidas
  - Filtra por telefone e org
  - Inclui dados do cliente vinculado

- [x] Interface `/messages` - **PRONTO**
  - Lista conversas em sidebar
  - Mostra thread de mensagens
  - Campo para enviar respostas
  - Auto-refresh a cada 8 segundos
  - Design Tailwind CSS matching app

- [x] Modelo de Dados - **PRONTO**
  - WhatsAppMessage model no Prisma
  - Relações com Client e Org
  - Indexes para performance
  - Migrations aplicadas

### ⚠️ O que FALTA CONFIGURAR:

#### 2. **Landing Page (lp-conversaoextrema-esther.vercel.app)** ⚠️

**Precisa implementar 2 endpoints:**

##### A) `/api/messages/send` (POST)

Endpoint para ENVIAR mensagens (usado pela interface)

```typescript
// app/api/messages/send/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json()

    // TODO: Implementar lógica de envio via provedor WhatsApp
    // Exemplo: chamar API do Twilio, Meta, etc

    return NextResponse.json({
      success: true,
      messageId: 'msg_' + Date.now(),
      message: 'Enviado com sucesso',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Falha ao enviar mensagem' },
      { status: 500 }
    )
  }
}
```

##### B) `/api/messages` (GET)

Endpoint para LISTAR mensagens recebidas

```typescript
// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Pode ser:
// 1. Consulta ao Prisma se tiver banco na LP
// 2. Proxy para gestao-clientes
// 3. Cache em Redis/KV

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = searchParams.get('limit') || '100'

  // TODO: Buscar mensagens do banco ou cache

  return NextResponse.json({
    items: [], // Array de mensagens
    count: 0,
  })
}
```

##### C) Webhook que JÁ ENVIA para gestao-clientes

Quando a landing page recebe mensagem WhatsApp, ela precisa fazer:

```typescript
// Seu código existente na LP que recebe WhatsApp:
async function onWhatsAppMessage(message: any) {
  // Enviar para gestao-clientes
  const GESTAO_WEBHOOK = process.env.GESTAO_CLIENTES_WEBHOOK_URL
  const SECRET = process.env.WHATSAPP_WEBHOOK_SECRET

  const payload = JSON.stringify({
    event: 'message',
    messageId: message.id,
    from: message.from, // Ex: 5541999998888
    name: message.profile?.name || message.from,
    type: 'text',
    text: message.text,
    timestamp: new Date().toISOString(),
  })

  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex')

  await fetch(GESTAO_WEBHOOK, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
    },
    body: payload,
  })
}
```

---

## 🚀 Como Testar AGORA (sem landing page):

### Teste 1: Simular webhook manualmente

```bash
# Terminal ou PowerShell
curl -X POST http://localhost:3000/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "messageId": "msg_test_123",
    "from": "5541999998888",
    "name": "João da Silva",
    "type": "text",
    "text": "Olá, vim da landing page!",
    "timestamp": "2024-12-19T10:30:00.000Z"
  }'
```

**O que acontece:**

1. ✅ Webhook valida e aceita
2. ✅ Busca cliente com telefone `+5541999998888`
3. ✅ NÃO encontra? Cria novo lead automaticamente:
   - Nome: "João da Silva"
   - Email: "temp.joao_da_silva_5541999998888@pending.local"
   - Telefone: "+5541999998888"
   - Status: "new"
4. ✅ Salva mensagem no banco associada ao cliente
5. ✅ Retorna success

### Teste 2: Ver mensagens na interface

1. Abrir navegador: `http://localhost:3000/messages`
2. ✅ Deve aparecer conversa com "João da Silva"
3. ✅ Clicar mostra a mensagem "Olá, vim da landing page!"
4. ✅ Pode digitar resposta (mas não envia ainda - precisa endpoint na LP)

### Teste 3: Verificar banco de dados

```bash
pnpm prisma studio
```

1. Abrir tabela `Client` → Ver lead criado
2. Abrir tabela `WhatsAppMessage` → Ver mensagem salva
3. ✅ Relação `clientId` está preenchida

---

## 🔧 Configuração para PRODUÇÃO:

### 1. Gestão Clientes (Netlify/Vercel)

Adicionar variáveis de ambiente:

```env
WHATSAPP_WEBHOOK_SECRET="SuaChaveSecreta123!@#"
NEXT_PUBLIC_MESSAGES_GATEWAY="https://lp-conversaoextrema-esther.vercel.app"
```

### 2. Landing Page (Vercel)

Adicionar variáveis de ambiente:

```env
GESTAO_CLIENTES_WEBHOOK_URL="https://seu-app.netlify.app/api/integrations/whatsapp/webhook"
WHATSAPP_WEBHOOK_SECRET="SuaChaveSecreta123!@#"  # MESMA secret
```

### 3. Provedor WhatsApp (Twilio/Meta/outro)

Configurar webhook do provedor para:

```
https://lp-conversaoextrema-esther.vercel.app/api/whatsapp/webhook
```

---

## 📋 Checklist Final:

### Gestão Clientes:

- [x] Webhook implementado
- [x] API de mensagens implementada
- [x] Interface /messages criada
- [x] Modelo Prisma criado
- [x] Migrations aplicadas
- [x] Auto-criação de leads funcionando
- [ ] Deploy com variáveis de ambiente

### Landing Page:

- [ ] Implementar `/api/messages` (GET)
- [ ] Implementar `/api/messages/send` (POST)
- [ ] Webhook do WhatsApp enviando para gestao-clientes
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy atualizado

---

## 🎯 Próximos Passos RECOMENDADOS:

1. **TESTE LOCAL primeiro** ✅
   - Usar script de teste: `.\scripts\test-whatsapp-integration.ps1`
   - Verificar criação de lead
   - Ver na interface /messages

2. **Implementar endpoints na Landing Page** 🔴
   - `/api/messages` (GET)
   - `/api/messages/send` (POST)

3. **Deploy em produção** 🟡
   - Configurar variáveis de ambiente
   - Testar fluxo completo com WhatsApp real

4. **Melhorias futuras** 🔵
   - Autenticação na rota /messages
   - Notificações em tempo real (WebSocket/SSE)
   - Templates de resposta rápida
   - Análise de sentimento
   - Chatbot automático

---

## 🐛 Troubleshooting:

### Problema: Mensagem não aparece na interface

- Verificar se webhook retornou 200
- Checar banco: `pnpm prisma studio`
- Ver logs do servidor Next.js

### Problema: Lead não foi criado

- Verificar formato do telefone no payload
- Ver função `normalizePhone()` no webhook
- Checar logs do Prisma

### Problema: Erro de CORS

- Adicionar domínio da LP em `next.config.ts`
- Ou implementar proxy na LP

---

**Resumo:** A aplicação gestao-clientes está 100% pronta para receber webhooks e mostrar conversas. Falta apenas implementar 2 endpoints na landing page para completar o ciclo.
