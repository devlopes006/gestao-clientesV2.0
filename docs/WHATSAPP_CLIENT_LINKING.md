# 🔗 Auto-associação de Clientes via WhatsApp

Este recurso opcional permite associar automaticamente mensagens do WhatsApp com clientes existentes no sistema.

## Como Funciona

Quando uma mensagem chega via webhook:

1. **Extrai o número de telefone** do payload (`from` ou `recipient_id`)
2. **Normaliza o número** (remove formatação, adiciona código do país)
3. **Busca no banco** por clientes com telefone correspondente
4. **Associa automaticamente** a mensagem ao cliente e org encontrados

## Ativar a Funcionalidade

### Opção 1: Substituir o arquivo inteiro

```powershell
# Backup do arquivo atual
Copy-Item "src\app\api\integrations\whatsapp\webhook\route.ts" `
          "src\app\api\integrations\whatsapp\webhook\route.ts.backup"

# Usar a versão com linking
Copy-Item "src\app\api\integrations\whatsapp\webhook\route-with-client-linking.ts.example" `
          "src\app\api\integrations\whatsapp\webhook\route.ts"
```

### Opção 2: Adicionar manualmente

Copie as funções `normalizePhone` e `findClientByPhone` do arquivo exemplo e integre ao seu `route.ts` atual.

## Vantagens

✅ **Contexto automático**: Mensagens vinculadas ao cliente correto  
✅ **Histórico unificado**: Veja todas as interações do cliente  
✅ **Filtros eficientes**: Busque mensagens por cliente/org  
✅ **Segmentação**: Identifique conversas por organização

## Exemplo de Busca

```typescript
// Buscar todas as mensagens de um cliente
const messages = await prisma.whatsAppMessage.findMany({
  where: { clientId: 'abc123' },
  orderBy: { timestamp: 'desc' },
})

// Buscar mensagens não associadas (novos leads)
const unlinkedMessages = await prisma.whatsAppMessage.findMany({
  where: { clientId: null },
  orderBy: { timestamp: 'desc' },
})

// Buscar por organização
const orgMessages = await prisma.whatsAppMessage.findMany({
  where: { orgId: 'org456' },
  include: { client: true },
})
```

## Normalização de Telefone

O sistema trata diferentes formatos:

| Entrada           | Normalizado      | Match |
| ----------------- | ---------------- | ----- |
| `41999998888`     | `+5541999998888` | ✅    |
| `+5541999998888`  | `+5541999998888` | ✅    |
| `5541999998888`   | `+5541999998888` | ✅    |
| `(41) 99999-8888` | `+5541999998888` | ✅    |

## Melhorias Futuras

### 1. Criação Automática de Leads

Se não encontrar cliente, criar automaticamente como lead:

```typescript
if (!client && phoneNumber) {
  client = await prisma.client.create({
    data: {
      name: body?.data?.name || 'Lead WhatsApp',
      phone: normalizePhone(phoneNumber),
      email: `whatsapp+${phoneNumber}@temp.local`,
      orgId: DEFAULT_ORG_ID, // Configurar org padrão
      status: 'lead',
    },
  })
}
```

### 2. Webhook de Notificação Interna

Disparar evento interno quando nova mensagem chega:

```typescript
// Após salvar mensagem
await notificationService.notify({
  type: 'whatsapp_message',
  clientId,
  orgId,
  message: body?.data?.text,
})
```

### 3. Match Fuzzy

Buscar clientes com nomes similares se telefone não der match:

```typescript
if (!client && body?.data?.name) {
  client = await prisma.client.findFirst({
    where: {
      name: { contains: body.data.name, mode: 'insensitive' },
    },
  })
}
```

## Painel Filtrado

Modifique o painel para mostrar apenas conversas de clientes conhecidos:

```typescript
// src/app/messages/page.tsx
const messages = await prisma.whatsAppMessage.findMany({
  where: {
    clientId: { not: null }, // Apenas mensagens associadas
  },
  include: {
    client: {
      select: { id: true, name: true, email: true },
    },
  },
})
```

## Dashboard de Leads

Crie uma página para novos contatos não associados:

```typescript
// src/app/leads/whatsapp/page.tsx
const newLeads = await prisma.whatsAppMessage.findMany({
  where: {
    clientId: null, // Mensagens não associadas
    event: 'message',
  },
  distinct: ['from'],
})
```

## API para Linking Manual

Permita usuários associarem mensagens manualmente:

```typescript
// POST /api/integrations/whatsapp/messages/[messageId]/link
export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const { clientId } = await req.json()

  await prisma.whatsAppMessage.updateMany({
    where: {
      from: (
        await prisma.whatsAppMessage.findUnique({
          where: { id: params.messageId },
        })
      )?.from,
    },
    data: { clientId },
  })

  return NextResponse.json({ success: true })
}
```

## Considerações

⚠️ **Performance**: Com muitos clientes, considere índices adicionais  
⚠️ **Privacidade**: Cuidado ao associar automaticamente (LGPD/GDPR)  
⚠️ **Duplicatas**: Telefone pode existir em múltiplas orgs

## Testes

```typescript
// test/whatsapp-linking.test.ts
describe('WhatsApp Client Linking', () => {
  it('should link message to existing client', async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        phone: '+5541999998888',
        email: 'test@example.com',
        orgId: 'org123',
      },
    })

    // Simular webhook
    const response = await fetch('/api/integrations/whatsapp/webhook', {
      method: 'POST',
      body: JSON.stringify({
        event: 'message',
        data: { from: '5541999998888', text: 'Hi' },
      }),
    })

    const message = await prisma.whatsAppMessage.findFirst({
      where: { from: '5541999998888' },
    })

    expect(message?.clientId).toBe(client.id)
  })
})
```

---

**Arquivo de referência:** `route-with-client-linking.ts.example`  
**Status:** Opcional - ative quando necessário  
**Última atualização:** 19/12/2025
