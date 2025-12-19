# ✅ Checklist de Validação - Criação Automática de Leads

Use este checklist para validar que a criação automática de leads está funcionando corretamente.

## 🔧 Pré-requisitos

- [ ] `pnpm install` executado
- [ ] `pnpm prisma:generate` executado
- [ ] `pnpm prisma migrate dev` executado (migração aplicada)
- [ ] Arquivo `.env.local` configurado com as variáveis:
  - [ ] `WHATSAPP_WEBHOOK_SECRET`
  - [ ] `NEXT_PUBLIC_MESSAGES_GATEWAY`
- [ ] Pelo menos 1 organização criada no banco
- [ ] Servidor rodando (`pnpm dev`)

---

## 🧪 Teste 1: Webhook Recebe Mensagem

### Executar:

```powershell
.\test-whatsapp-webhook.ps1
```

### Validar:

- [ ] Retorna status 200
- [ ] Log mostra: `[WhatsApp Webhook] Event: message`
- [ ] Log mostra: `Cliente não encontrado`
- [ ] Log mostra: `Criando novo lead`
- [ ] Log mostra: `Novo lead criado`
- [ ] Log mostra: `Message saved to database { linkedToClient: true }`

---

## 🗄️ Teste 2: Lead Criado no Banco

### Verificar no Prisma Studio:

```bash
pnpm prisma studio
```

### Validar na tabela `Client`:

- [ ] Novo cliente existe
- [ ] `name` = "Cliente Teste" ou nome fornecido
- [ ] `phone` = "+5541999998888" (normalizado)
- [ ] `email` termina com `@lead.temp`
- [ ] `status` = "lead"
- [ ] `orgId` preenchido

### Validar na tabela `WhatsAppMessage`:

- [ ] Mensagem salva
- [ ] `from` = "+5541999998888"
- [ ] `text` contém o texto enviado
- [ ] `clientId` **está preenchido** (associado ao lead)
- [ ] `orgId` **está preenchido**

---

## 💻 Teste 3: Lead Aparece no Painel

### Acessar:

```
http://localhost:3000/messages
```

### Validar:

- [ ] Lista de conversas carrega
- [ ] Aparece conversa com o telefone/nome do lead
- [ ] Ao clicar, mostra a mensagem recebida
- [ ] Campo "Para" é preenchido com o telefone
- [ ] Pode digitar resposta

---

## 🔄 Teste 4: Segunda Mensagem do Mesmo Número

### Executar novamente:

```powershell
.\test-whatsapp-webhook.ps1
```

### Validar:

- [ ] Log mostra: `Cliente encontrado` (não `Criando novo lead`)
- [ ] Log mostra o `clientId` do lead existente
- [ ] **NÃO cria lead duplicado**
- [ ] Nova mensagem vinculada ao mesmo `clientId`

### Verificar no Prisma Studio:

- [ ] Apenas 1 cliente com aquele telefone
- [ ] 2 mensagens vinculadas ao mesmo `clientId`

---

## 📱 Teste 5: Responder Lead

### No painel `/messages`:

1. [ ] Selecionar conversa do lead
2. [ ] Digitar mensagem de teste
3. [ ] Clicar "Enviar"

### Validar:

- [ ] Mensagem enviada com sucesso
- [ ] Aparece alert "Enviado!"
- [ ] Log do servidor não mostra erros

---

## 🎯 Teste 6: Números Diferentes

### Testar normalização de telefone:

#### Teste 6.1: Formato (DD) DDDDD-DDDD

```powershell
# Editar test-whatsapp-webhook.ps1
# Mudar: "from" = "(41) 98765-4321"
.\test-whatsapp-webhook.ps1
```

- [ ] Normalizado para `+5541987654321`
- [ ] Lead criado corretamente

#### Teste 6.2: Formato sem código país

```powershell
# Mudar: "from" = "41987654321"
.\test-whatsapp-webhook.ps1
```

- [ ] Normalizado para `+5541987654321`
- [ ] Encontra o lead anterior (não duplica)

#### Teste 6.3: Formato internacional

```powershell
# Mudar: "from" = "+5541987654321"
.\test-whatsapp-webhook.ps1
```

- [ ] Mantém `+5541987654321`
- [ ] Encontra o lead anterior (não duplica)

---

## 🔐 Teste 7: Segurança

### Teste 7.1: Sem assinatura HMAC

```powershell
curl -X POST http://localhost:3000/api/integrations/whatsapp/webhook `
  -H "Content-Type: application/json" `
  -d '{"event":"message","data":{"from":"5541999998888"}}'
```

- [ ] Retorna 401 Unauthorized
- [ ] Log: `[WhatsApp Webhook] Invalid signature`
- [ ] **NÃO cria lead**

### Teste 7.2: Assinatura HMAC inválida

```powershell
curl -X POST http://localhost:3000/api/integrations/whatsapp/webhook `
  -H "Content-Type: application/json" `
  -H "X-Signature: abc123invalid" `
  -d '{"event":"message","data":{"from":"5541999998888"}}'
```

- [ ] Retorna 401 Unauthorized
- [ ] **NÃO cria lead**

---

## 📊 Teste 8: Query no Banco

### Executar queries de teste:

```sql
-- Contar leads WhatsApp
SELECT COUNT(*) FROM clients WHERE status = 'lead';
```

- [ ] Retorna número esperado de leads

```sql
-- Ver todos os leads com mensagens
SELECT c.name, c.phone, c.status, COUNT(w.id) as msg_count
FROM clients c
LEFT JOIN whatsapp_messages w ON w.client_id = c.id
WHERE c.status = 'lead'
GROUP BY c.id;
```

- [ ] Lista leads corretamente
- [ ] Mostra contagem de mensagens

```sql
-- Buscar leads sem org
SELECT * FROM clients WHERE status = 'lead' AND org_id IS NULL;
```

- [ ] Retorna 0 resultados (todos devem ter org)

---

## 🚨 Troubleshooting

### ❌ Lead não é criado

**Possíveis causas:**

1. [ ] Nenhuma org no banco → Criar org primeiro
2. [ ] Erro no Prisma → Checar logs do servidor
3. [ ] Event não é "message" → Só cria lead para messages

### ❌ Lead duplicado

**Possíveis causas:**

1. [ ] Normalização falhou → Verificar função `normalizePhone`
2. [ ] Busca não encontrou → Verificar variações do telefone
3. [ ] Transação não completou → Verificar logs de erro

### ❌ Erro "Client already exists"

**Solução:**

- Email único violado → Sistema já trata com timestamp
- Se persistir, verificar se já existe cliente com aquele telefone

---

## ✅ Validação Final

### Confirme que:

- [ ] Leads são criados automaticamente
- [ ] Leads não são duplicados
- [ ] Mensagens são vinculadas corretamente
- [ ] Todos os leads têm org associada
- [ ] Telefones são normalizados
- [ ] Painel mostra leads corretamente
- [ ] Pode responder leads pelo painel
- [ ] Logs estão limpos (sem erros)
- [ ] Segurança HMAC funciona

---

## 🎉 Sucesso!

Se todos os itens estão ✅, a criação automática de leads está funcionando perfeitamente!

### Estatísticas de Teste

```
Total de testes: 8
Testes passados: ___
Leads criados: ___
Mensagens salvas: ___
Duplicatas evitadas: ___
```

### Próximos Passos

1. [ ] Configurar webhook na Landing Page (Vercel)
2. [ ] Testar com mensagens reais
3. [ ] Treinar equipe no painel `/messages`
4. [ ] Configurar notificações para novos leads
5. [ ] Implementar dashboard de conversão

---

**Data do teste:** ****\_\_\_****  
**Testado por:** ****\_\_\_****  
**Ambiente:** [ ] Local [ ] Staging [ ] Production  
**Status:** [ ] ✅ Aprovado [ ] ⚠️ Com ressalvas [ ] ❌ Reprovado

---

**Arquivo de referência:** `docs/WHATSAPP_AUTO_LEAD_CREATION.md`  
**Script de teste:** `test-whatsapp-webhook.ps1`
