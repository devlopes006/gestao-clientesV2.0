# Integração WhatsApp - Landing Page

Este documento descreve como configurar a integração do WhatsApp entre a landing page (LP) e o sistema de gestão de clientes.

## Arquitetura

```
Landing Page (LP)
    ↓ (quando cliente preenche formulário)
    ↓ webhook POST
    ↓
gestao-clientesV2.0/api/integrations/whatsapp/webhook
    ↓
Salva no banco (Prisma)
    ↓
Painel /messages lista e envia mensagens
```

## Arquivos Criados

### 1. Webhook (`src/app/api/integrations/whatsapp/webhook/route.ts`)

- Recebe eventos de mensagens/status do WhatsApp
- Valida assinatura HMAC para segurança
- Persiste mensagens no banco de dados Prisma
- Retorna confirmação de recebimento

### 2. Painel de Mensagens (`src/app/messages/page.tsx`)

- Lista todas as conversas agrupadas por número de telefone
- Exibe histórico de mensagens de cada conversa
- Permite enviar mensagens através do gateway da LP
- Auto-refresh a cada 8 segundos

### 3. Modelo Prisma (`prisma/schema.prisma`)

- Novo modelo `WhatsAppMessage` para persistir mensagens
- Relacionamento com `Org` e `Client` (opcional)
- Índices para consultas rápidas por telefone e timestamp

## Configuração

### 1. Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
# WhatsApp Webhook Integration
WHATSAPP_WEBHOOK_SECRET="sua-chave-compartilhada-hmac"
NEXT_PUBLIC_MESSAGES_GATEWAY="https://lp-conversaoextrema-esther.vercel.app"
```

### 2. Configurar Landing Page

No ambiente Vercel da Landing Page, configure:

```env
GESTAO_CLIENTES_WEBHOOK_URL=https://SEU-APP.com/api/integrations/whatsapp/webhook
GESTAO_CLIENTES_WEBHOOK_SECRET=<mesma_chave_do_WHATSAPP_WEBHOOK_SECRET>
```

**Importante:** Use a MESMA chave secreta nos dois lados para validação HMAC.

### 3. Migração do Banco de Dados

Execute a migração do Prisma para criar a tabela `WhatsAppMessage`:

```bash
pnpm prisma:generate
pnpm prisma:migrate dev --name add-whatsapp-messages
```

## Como Funciona

### Fluxo de Recebimento

1. Cliente preenche formulário na Landing Page e envia mensagem
2. LP envia webhook POST para `/api/integrations/whatsapp/webhook`
3. Webhook valida assinatura HMAC
4. **Sistema busca cliente pelo telefone no banco**
5. **Se não encontrar, cria automaticamente um novo lead**
6. Salva mensagem associada ao cliente (novo ou existente)
7. Retorna confirmação para a LP

### Criação Automática de Leads ✨

Quando uma mensagem chega de um número desconhecido:

- ✅ Sistema normaliza o telefone (+55DDDNÚMERO)
- ✅ Busca cliente com esse telefone no banco
- ✅ Se não encontrar, **cria automaticamente** como lead
- ✅ Associa a mensagem ao novo cliente
- ✅ Cliente fica disponível no sistema com status "lead"

**Dados do lead criado:**

- Nome: do formulário ou "Lead WhatsApp +55..."
- Telefone: normalizado
- Email: temporário (`whatsapp+5541...@lead.temp`)
- Status: `lead`
- Organização: primeira org disponível

### Fluxo de Envio

1. Acesse `/messages` no seu app
2. Selecione uma conversa ou digite um número novo
3. Digite a mensagem e clique em "Enviar"
4. O painel chama a API da LP para enviar via WhatsApp

## Estrutura do Payload

### Mensagem Recebida

```json
{
  "event": "message",
  "data": {
    "id": "wamid.xxx",
    "from": "5541999998888",
    "to": null,
    "name": "João Silva",
    "type": "text",
    "text": "Olá, gostaria de mais informações",
    "timestamp": "2025-12-19T10:30:00Z"
  }
}
```

### Status de Mensagem

```json
{
  "event": "status",
  "data": {
    "id": "wamid.xxx",
    "recipient_id": "5541999998888",
    "status": "delivered",
    "timestamp": "2025-12-19T10:30:05Z"
  }
}
```

## Testes

### 1. Testar Webhook Localmente

```bash
# Terminal 1: Inicie o app
pnpm dev

# Terminal 2: Teste com curl
curl -X POST http://localhost:3000/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: <calcular_hmac>" \
  -d '{
    "event": "message",
    "data": {
      "id": "test123",
      "from": "5541999998888",
      "name": "Teste",
      "type": "text",
      "text": "Mensagem de teste",
      "timestamp": "2025-12-19T10:00:00Z"
    }
  }'
```

### 2. Calcular HMAC (Node.js)

```javascript
const crypto = require('crypto')
const payload = JSON.stringify({ event: 'message', data: {...} })
const secret = 'sua-chave-compartilhada-hmac'
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
console.log('X-Signature:', signature)
```

### 3. Testar Painel

1. Acesse `http://localhost:3000/messages`
2. Verifique se as mensagens aparecem
3. Selecione uma conversa
4. Envie uma mensagem de teste

## Segurança

### Validação HMAC

O webhook valida todas as requisições usando HMAC SHA-256:

1. LP calcula hash do payload usando a chave secreta
2. Envia hash no header `X-Signature`
3. Webhook recalcula o hash e compara
4. Rejeita requisições com assinatura inválida (401)

### Recomendações

- ✅ Use chaves secretas fortes (mínimo 32 caracteres)
- ✅ Mantenha as chaves seguras (não commite no Git)
- ✅ Use HTTPS em produção
- ✅ Monitore logs do webhook para atividades suspeitas
- ✅ Considere rate limiting para prevenir abuso

## Melhorias Futuras

1. **Autenticação/Autorização no Painel**
   - Atualmente o painel `/messages` é aberto
   - Adicionar proteção com middleware de autenticação

2. **Associação Automática com Clientes**
   - Buscar cliente por telefone ao receber mensagem
   - Auto-popular `clientId` no `WhatsAppMessage`

3. **Notificações em Tempo Real**
   - Implementar WebSockets ou Server-Sent Events
   - Alertar usuários quando nova mensagem chega

4. **Filtros e Busca**
   - Filtrar por período, status, cliente
   - Busca por conteúdo de mensagens

5. **Templates de Resposta**
   - Criar respostas rápidas predefinidas
   - Personalização com variáveis dinâmicas

6. **Métricas e Analytics**
   - Dashboard com estatísticas de conversas
   - Tempo médio de resposta
   - Taxa de conversão

## Troubleshooting

### Webhook não recebe mensagens

1. Verifique se `GESTAO_CLIENTES_WEBHOOK_URL` está correto na LP
2. Confirme que o app está acessível publicamente (use ngrok local)
3. Verifique logs do webhook: `console.log` aparece no terminal

### Erro "invalid signature"

1. Confirme que `WHATSAPP_WEBHOOK_SECRET` é igual nos dois lados
2. Verifique se o payload não foi modificado em trânsito
3. Teste com HMAC calculado manualmente

### Painel não carrega mensagens

1. Verifique `NEXT_PUBLIC_MESSAGES_GATEWAY` no `.env.local`
2. Abra DevTools (F12) e veja erros no Console/Network
3. Confirme que a LP está respondendo em `/api/messages`

### Erro ao salvar no banco

1. Execute `pnpm prisma:generate` novamente
2. Verifique se a migração foi aplicada
3. Confirme que `DATABASE_URL` está correto

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs do servidor (`pnpm dev`)
2. Inspecione o payload recebido no webhook
3. Consulte documentação do WhatsApp Business API
4. Revise este documento e os exemplos de teste

---

**Status:** ✅ Implementado e pronto para uso
**Última atualização:** 19/12/2025
