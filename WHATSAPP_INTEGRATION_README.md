# 🚀 Quick Start - Integração WhatsApp

## Setup Rápido

Execute o script PowerShell para configurar tudo automaticamente:

```powershell
.\setup-whatsapp-integration.ps1
```

Este script irá:

- ✅ Instalar dependências
- ✅ Gerar Prisma Client
- ✅ Aplicar migração do banco
- ✅ Configurar variáveis de ambiente
- ✅ Gerar chave secreta HMAC

## Configuração Manual

Se preferir configurar manualmente:

### 1. Adicione ao `.env.local`:

```env
WHATSAPP_WEBHOOK_SECRET="sua-chave-secreta-forte"
NEXT_PUBLIC_MESSAGES_GATEWAY="https://lp-conversaoextrema-esther.vercel.app"
```

### 2. Execute as migrações:

```bash
pnpm prisma:generate
pnpm prisma migrate dev --name add-whatsapp-messages
```

### 3. Configure na Landing Page (Vercel):

```env
GESTAO_CLIENTES_WEBHOOK_URL=https://SEU-APP/api/integrations/whatsapp/webhook
GESTAO_CLIENTES_WEBHOOK_SECRET=<mesma chave do WHATSAPP_WEBHOOK_SECRET>
```

## Testando

### 1. Inicie o servidor:

```bash
pnpm dev
```

### 2. Teste o webhook:

```powershell
.\test-whatsapp-webhook.ps1
```

### 3. Acesse o painel:

```
http://localhost:3000/messages
```

## Arquivos Criados

```
src/app/api/integrations/whatsapp/
├── webhook/route.ts          # Recebe webhooks da LP
└── messages/route.ts          # Lista mensagens do banco local

src/app/messages/
└── page.tsx                   # Painel de conversas

prisma/schema.prisma
└── WhatsAppMessage model      # Modelo para persistência

docs/
└── WHATSAPP_LP_INTEGRATION.md # Documentação completa

scripts/
├── setup-whatsapp-integration.ps1    # Setup automático
└── test-whatsapp-webhook.ps1         # Testes
```

## APIs Disponíveis

### Webhook (POST)

```
POST /api/integrations/whatsapp/webhook
Header: X-Signature (HMAC SHA-256)
Body: { event, data: { id, from, text, timestamp, ... } }
```

### Listar Mensagens (GET)

```
GET /api/integrations/whatsapp/messages?limit=100&from=5541999998888
```

### Painel Web

```
GET /messages
```

## ✨ Funcionalidades Principais

- ✅ **Criação Automática de Leads** - Sistema cria clientes automaticamente ao receber mensagens de números desconhecidos
- ✅ **Associação Inteligente** - Vincula mensagens a clientes existentes por telefone
- ✅ **Webhook Seguro** - Validação HMAC em todas as requisições
- ✅ **Painel em Tempo Real** - Visualize e responda conversas instantaneamente
- ✅ **Persistência Completa** - Histórico salvo no Prisma/Postgres

Veja detalhes em [docs/WHATSAPP_AUTO_LEAD_CREATION.md](docs/WHATSAPP_AUTO_LEAD_CREATION.md)

## Segurança

- ✅ Validação HMAC em todos os webhooks
- ✅ Chaves secretas não commitadas
- ⚠️ Adicione autenticação ao painel `/messages` (TODO)

## Troubleshooting

### Webhook retorna 401

→ Verifique se `WHATSAPP_WEBHOOK_SECRET` é igual nos dois lados

### Painel não carrega

→ Confirme `NEXT_PUBLIC_MESSAGES_GATEWAY` no `.env.local`

### Erro no banco

→ Execute `pnpm prisma:generate` novamente

## 📖 Documentação Completa

Consulte [docs/WHATSAPP_LP_INTEGRATION.md](docs/WHATSAPP_LP_INTEGRATION.md) para:

- Arquitetura detalhada
- Exemplos de payloads
- Melhorias futuras
- Troubleshooting avançado

---

**Status:** ✅ Pronto para uso  
**Última atualização:** 19/12/2025
