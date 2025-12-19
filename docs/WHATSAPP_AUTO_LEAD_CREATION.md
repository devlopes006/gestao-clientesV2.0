# 🎯 Criação Automática de Leads via WhatsApp

## Visão Geral

O sistema agora **cria automaticamente novos clientes (leads)** quando recebe mensagens de números desconhecidos através da landing page. Isso elimina a necessidade de cadastro manual e garante que nenhum lead seja perdido.

## Como Funciona

### Fluxo Completo

```
1. Mensagem chega da LP
   ↓
2. Sistema busca telefone no banco
   ↓
3a. ENCONTROU → Associa ao cliente existente
   ↓
3b. NÃO ENCONTROU → Cria novo lead automaticamente
   ↓
4. Salva mensagem vinculada ao cliente
   ↓
5. Lead aparece no sistema imediatamente
```

### Exemplo Prático

**Cenário:** Cliente preenche formulário na LP com:

- Nome: "João Silva"
- Telefone: "(41) 99999-8888"
- Mensagem: "Quero conhecer o serviço"

**O que acontece:**

1. ✅ Sistema normaliza: `+5541999998888`
2. ✅ Busca no banco → não encontra
3. ✅ Cria cliente automaticamente:
   ```json
   {
     "name": "João Silva",
     "phone": "+5541999998888",
     "email": "whatsapp+5541999998888+1734630000@lead.temp",
     "status": "lead",
     "orgId": "primeira-org-disponivel"
   }
   ```
4. ✅ Salva mensagem vinculada
5. ✅ Lead fica visível em `/messages` e no sistema

## Dados do Lead Criado

| Campo           | Valor                                   | Observação                      |
| --------------- | --------------------------------------- | ------------------------------- |
| **Nome**        | Do formulário ou `Lead WhatsApp +55...` | Use nome informado pelo cliente |
| **Telefone**    | Normalizado `+55DDDNÚMERO`              | Sempre formato E.164            |
| **Email**       | `whatsapp+TELEFONE+TIMESTAMP@lead.temp` | Temporário e único              |
| **Status**      | `lead`                                  | Identifica como novo lead       |
| **Organização** | Primeira org cadastrada                 | Pode ser customizado            |

## Normalização de Telefone

O sistema trata automaticamente diferentes formatos:

| Formato Recebido    | Normalizado      |
| ------------------- | ---------------- |
| `41999998888`       | `+5541999998888` |
| `(41) 99999-8888`   | `+5541999998888` |
| `+55 41 99999-8888` | `+5541999998888` |
| `5541999998888`     | `+5541999998888` |

## Configuração

### Organização Padrão

Por padrão, usa a **primeira organização** criada. Para customizar:

```typescript
// src/app/api/integrations/whatsapp/webhook/route.ts

async function createLeadFromWhatsApp(data: { phone: string; name?: string }) {
  // Opção 1: Org específica via env
  const defaultOrgId = process.env.WHATSAPP_DEFAULT_ORG_ID

  // Opção 2: Buscar por nome
  const org = await prisma.org.findFirst({
    where: { name: 'Minha Empresa' },
  })

  // Opção 3: Owner específico
  const org = await prisma.org.findFirst({
    where: { owner: { email: 'seu@email.com' } },
  })
}
```

### Status Customizado

Altere o status padrão se preferir:

```typescript
const client = await prisma.client.create({
  data: {
    // ...
    status: 'new', // Em vez de 'lead'
    // ou
    status: 'whatsapp-lead', // Status customizado
  },
})
```

## Visualizando Novos Leads

### No Painel de Mensagens

Acesse `/messages` para ver todas as conversas, incluindo novos leads:

```
💬 Conversas
┌─────────────────────────┐
│ 👤 João Silva          │
│ Quero conhecer o...    │ ← Novo lead
└─────────────────────────┘
```

### Consulta no Banco

```typescript
// Buscar todos os leads do WhatsApp
const whatsappLeads = await prisma.client.findMany({
  where: {
    status: 'lead',
    email: { contains: '@lead.temp' },
  },
  include: {
    whatsappMessages: {
      orderBy: { timestamp: 'desc' },
    },
  },
})
```

### API Endpoint

```bash
# Listar leads WhatsApp
GET /api/clients?status=lead&channel=whatsapp
```

## Próximas Ações

Após criar o lead automaticamente, você pode:

### 1. Atualizar Informações

```typescript
// Atualizar email após coleta
await prisma.client.update({
  where: { id: leadId },
  data: {
    email: 'joao.real@email.com',
    // Remover flag temporária
  },
})
```

### 2. Converter em Cliente

```typescript
// Mudar status após fechar negócio
await prisma.client.update({
  where: { id: leadId },
  data: {
    status: 'active',
    contractStart: new Date(),
    contractValue: 1000,
  },
})
```

### 3. Criar Tarefas Automáticas

```typescript
// Criar follow-up automático
await prisma.task.create({
  data: {
    title: 'Follow-up lead WhatsApp',
    clientId: leadId,
    orgId: lead.orgId,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
    status: 'TODO',
  },
})
```

### 4. Notificar Equipe

```typescript
// Enviar notificação para equipe
await notificationService.send({
  type: 'new_whatsapp_lead',
  message: `Novo lead: ${client.name} - ${client.phone}`,
  recipients: ['vendas@empresa.com'],
})
```

## Dashboard de Leads

Crie uma página específica para leads WhatsApp:

```typescript
// src/app/leads/whatsapp/page.tsx
export default async function WhatsAppLeadsPage() {
  const leads = await prisma.client.findMany({
    where: {
      status: 'lead',
      whatsappMessages: { some: {} }
    },
    include: {
      whatsappMessages: {
        take: 1,
        orderBy: { timestamp: 'desc' }
      }
    }
  })

  return (
    <div>
      <h1>Leads WhatsApp ({leads.length})</h1>
      {leads.map(lead => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  )
}
```

## Métricas Úteis

### Conversão de Leads

```typescript
// Quantos leads WhatsApp viraram clientes?
const stats = await prisma.$queryRaw`
  SELECT 
    COUNT(*) FILTER (WHERE status = 'lead') as leads,
    COUNT(*) FILTER (WHERE status = 'active') as converted
  FROM clients
  WHERE email LIKE '%@lead.temp%'
`
```

### Tempo Médio de Resposta

```typescript
// Quanto tempo demora para responder um lead?
const avgResponseTime = await prisma.whatsAppMessage.aggregate({
  where: {
    clientId: { not: null },
    event: 'message',
  },
  _avg: {
    // Calcular diferença entre primeira e segunda mensagem
  },
})
```

## Melhorias Futuras

### 1. Enriquecimento de Dados

Após criar lead, buscar informações adicionais:

- CEP via API ViaCEP
- Redes sociais
- Validação de email

### 2. Classificação Automática

Use IA para classificar leads:

```typescript
const classification = await ai.classify(message.text)
if (classification.intent === 'compra') {
  await prisma.client.update({
    where: { id: leadId },
    data: { priority: 'HIGH' },
  })
}
```

### 3. Distribuição Automática

Atribua leads para equipe:

```typescript
const nextAgent = await getNextAvailableAgent()
await assignLeadToAgent(leadId, nextAgent.id)
```

## Troubleshooting

### Leads duplicados

Se criar duplicatas, adicione validação:

```typescript
// Verificar se já existe antes de criar
const existing = await prisma.client.findFirst({
  where: {
    OR: [{ phone: normalizedPhone }, { email: tempEmail }],
  },
})

if (existing) {
  return existing
}
```

### Email temporário conflita

Ajuste o formato:

```typescript
// Adicionar UUID para garantir unicidade
import { randomUUID } from 'crypto'

const tempEmail = `whatsapp+${randomUUID()}@lead.temp`
```

### Org não encontrada

Defina org padrão nas env vars:

```env
# .env.local
WHATSAPP_DEFAULT_ORG_ID="org_xxx"
```

## Logs e Monitoramento

Todos os eventos são logados:

```
[WhatsApp Webhook] Cliente não encontrado para: +5541999998888
[WhatsApp Webhook] Criando novo lead...
[WhatsApp Webhook] Novo lead criado: {
  clientId: 'cuid...',
  name: 'João Silva',
  phone: '+5541999998888'
}
[WhatsApp Webhook] Message saved to database { linkedToClient: true }
```

## Resumo

✅ **Automático**: Nenhum lead perdido  
✅ **Instantâneo**: Lead disponível imediatamente  
✅ **Inteligente**: Normaliza e deduplica telefones  
✅ **Rastreável**: Todas mensagens vinculadas  
✅ **Flexível**: Fácil de customizar

---

**Status:** ✅ Ativo por padrão  
**Arquivo:** `src/app/api/integrations/whatsapp/webhook/route.ts`  
**Última atualização:** 19/12/2025
