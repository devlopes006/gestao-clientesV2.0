# 💬 Fluxo de Mensagens - Landing Page para Sistema

## Como funciona

### 1. Lead preenche formulário na Landing Page

- Nome, email, telefone, plano desejado, melhor horário

### 2. Landing Page envia para `/api/leads`

```typescript
POST https://mygest.netlify.app/api/leads
{
  "name": "Anderson Lopes",
  "email": "developesanderson@gmail.com",
  "phone": "5541984093321",
  "plan": "Premium",
  "bestTime": "Manhã"
}
```

### 3. Sistema cria/atualiza o cliente

- Status: `lead`
- Organização: primeira disponível
- Telefone normalizado: `+5541984093321`

### 4. ✨ Mensagem de boas-vindas é criada automaticamente

O sistema cria uma mensagem no WhatsApp com o mesmo conteúdo que o lead recebe:

```
Olá Anderson Lopes! 👋

Recebemos seu interesse no Método Gestão Extrema da Esther Social Media!

📋 Seus dados:
• E-mail: developesanderson@gmail.com
• Plano: Premium
• WhatsApp: 55 41 98409-3321

✅ Próximos passos:
Nossa equipe entrará em contato em breve para agendar uma conversa inicial e
explicar tudo sobre o programa.

🚀 Prepare-se para transformar seu Instagram em uma máquina de autoridade!

Esta é uma mensagem automática de confirmação.

Esther Social Media © 2025
```

### 5. Mensagem aparece no sistema

- **Página:** `/messages`
- **Visual:** Bolha azul/roxa com indicador "Mensagem automática de boas-vindas"
- **Ícone:** ✨ Sparkles
- **Formato:** Preserva quebras de linha e formatação

## Características especiais

### Indicadores visuais na mensagem:

1. **Mensagem de boas-vindas (automática)**
   - Cor: Gradiente azul → roxo
   - Badge: "Mensagem automática de boas-vindas" com ícone ✨
   - Fonte: `landing_page_welcome` no metadata

2. **Mensagem enviada pelo sistema**
   - Cor: Verde → teal (padrão)
   - Status: enviada/lida/erro

3. **Mensagem recebida do cliente**
   - Cor: Cinza escuro
   - Alinhamento: esquerda

### Metadata armazenado:

```json
{
  "source": "landing_page_welcome",
  "leadData": {
    "plan": "Premium",
    "bestTime": "Manhã",
    "origin": "landing-page-conversao-extrema"
  }
}
```

## Fluxo de conversação

```
┌─────────────────┐
│ Lead preenche   │
│ formulário LP   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/leads │
│ Cria cliente    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ createWelcomeMessage()      │
│ Salva mensagem no banco     │
│ WhatsAppMessage             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Aparece em /messages        │
│ Thread do telefone do lead  │
│ Mensagem formatada          │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Equipe responde            │
│ Conversa prossegue          │
└─────────────────────────────┘
```

## Resolução de problemas anteriores

### ❌ Antes

- Mensagens apareciam bugadas
- Somente nome do lead
- Mensagens em branco
- Sem contexto da landing page

### ✅ Agora

- Mensagem completa e formatada
- Indicador visual claro (mensagem automática)
- Preserva quebras de linha
- Metadata com informações do lead
- Fallback para mensagens sem conteúdo: `[Mensagem sem conteúdo]`

## Customização

Para alterar o texto da mensagem de boas-vindas, edite:

**Arquivo:** `src/app/api/leads/route.ts`

**Função:** `createWelcomeMessage()`

```typescript
const welcomeText = `Olá ${client.name}! 👋

Seu texto personalizado aqui...
`
```

## Testes

### 1. Testar criação de lead

```bash
pnpm leads:test
```

### 2. Verificar mensagem no banco

```bash
pnpm prisma:studio
# Abrir tabela WhatsAppMessage
# Filtrar por from = 'system'
```

### 3. Ver na interface

1. Login: http://localhost:3000/login
2. Mensagens: http://localhost:3000/messages
3. Selecionar thread com telefone do lead
4. Verificar mensagem azul/roxa com badge

## Próximos recursos sugeridos

- [ ] Notificação em tempo real quando novo lead chegar
- [ ] Áudio de notificação
- [ ] Badge com contador de novos leads não visualizados
- [ ] Respostas rápidas (templates)
- [ ] Integração real com WhatsApp Business API
- [ ] Status de "digitando..."
- [ ] Confirmação de leitura do lead
