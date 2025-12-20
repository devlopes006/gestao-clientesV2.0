# 🔍 Troubleshooting - Leads não aparecem

## Problema
Leads enviados da Landing Page não aparecem na página `/leads`

## ✅ Checklist de diagnóstico

### 1️⃣ Verificar servidor rodando
```bash
pnpm dev
```
- ✅ Deve iniciar em `http://localhost:3000`

### 2️⃣ Testar endpoint localmente
```bash
pnpm leads:test
```

**Resultado esperado:**
```
✅ Lead enviado com sucesso!
Client ID: cltxxxxxxxxxxxxxx
Action: created
```

**Se falhar:**
- ❌ `ECONNREFUSED` → servidor não está rodando
- ❌ `401 Invalid signature` → problema com WEBHOOK_SECRET
- ❌ `500 Internal error` → problema no banco de dados

### 3️⃣ Verificar banco de dados

```bash
pnpm prisma:studio
```

1. Abrir em `http://localhost:5555`
2. Clicar em `Client`
3. Verificar se existem registros com `status = "lead"`

### 4️⃣ Verificar logs do endpoint

Quando enviar do formulário da LP, verificar terminal onde roda `pnpm dev`:

```
[Leads API] ===== Nova requisição recebida =====
[Leads API] URL: http://localhost:3000/api/leads
[Leads API] Method: POST
[Leads API] Headers: {...}
[Leads API] Lead recebido: { name: '...', email: '...', phone: '...' }
[Leads API] Novo lead criado: { clientId: '...', name: '...', phone: '...' }
```

**Se NÃO aparecer nada** → Landing Page não está enviando

### 5️⃣ Verificar configuração da Landing Page

**Arquivo `.env` da LP deve ter:**
```bash
GESTAO_CLIENTES_LEADS_URL=http://localhost:3000/api/leads
# Para produção:
# GESTAO_CLIENTES_LEADS_URL=https://mygest.netlify.app/api/leads

# Opcional (se quiser validação HMAC):
# GESTAO_CLIENTES_WEBHOOK_SECRET=seu-secret-aqui
```

**Código do formulário deve chamar:**
```typescript
import { sendLeadToGestao } from '@/lib/gestaoClientesAPI'

// No submit do form:
await sendLeadToGestao({
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  plan: formData.plan,
  bestTime: formData.bestTime,
  origin: 'landing-page-conversao-extrema'
})
```

### 6️⃣ Testar página /leads

1. Fazer login em `http://localhost:3000/login`
2. Acessar `http://localhost:3000/leads`
3. Deve listar os leads com status "lead"

**Se aparecer erro:**
- ❌ `401 Unauthorized` → problema de autenticação
- ❌ `500 Internal error` → problema no banco
- ❌ `0 leads encontrados` → nenhum lead cadastrado OU status diferente de "lead"

### 7️⃣ Verificar CORS (apenas produção)

Se estiver testando com LP em `https://lp-conversaoextrema-esther.vercel.app`:

1. Verificar console do navegador (F12)
2. Procurar erros de CORS
3. Se tiver erro, o Netlify precisa permitir requisições cross-origin

## 🚀 Teste rápido end-to-end

### Cenário 1: Teste local completo

```bash
# Terminal 1: iniciar servidor
pnpm dev

# Terminal 2: enviar lead de teste
pnpm leads:test

# Navegador: verificar lead
# 1. Login: http://localhost:3000/login
# 2. Leads: http://localhost:3000/leads
# 3. Verificar se aparece "João Silva Teste"
```

### Cenário 2: Teste com Landing Page

1. **Na Landing Page:**
   - Preencher formulário completo
   - Clicar "Enviar" ou "Quero começar"
   - Verificar console do navegador (F12) se há erros

2. **No Gestão Clientes:**
   - Verificar terminal onde roda `pnpm dev`
   - Deve aparecer logs `[Leads API] Lead recebido...`
   - Acessar `/leads` e verificar novo lead

3. **Se não funcionar:**
   - Verificar URL em `.env` da LP
   - Verificar se código está chamando `sendLeadToGestao`
   - Verificar Network tab (F12) se requisição foi enviada

## 🐛 Problemas comuns

### Lead criado mas não aparece na página

**Causa:** Status diferente de "lead"

**Solução:**
```bash
# Abrir Prisma Studio
pnpm prisma:studio

# Verificar campo "status" do Client
# Se estiver "new", "active", etc, mudar para "lead"
```

### HMAC signature inválida

**Causa:** SECRET diferente entre LP e Gestão

**Solução:**
```bash
# Landing Page .env
GESTAO_CLIENTES_WEBHOOK_SECRET=meu-secret-123

# Gestão Clientes .env
WHATSAPP_WEBHOOK_SECRET=meu-secret-123
```

**Ambos devem ser EXATAMENTE iguais!**

### Requisição não chega no servidor

**Causa:** URL incorreta na LP

**Solução:**
```bash
# Local
GESTAO_CLIENTES_LEADS_URL=http://localhost:3000/api/leads

# Produção
GESTAO_CLIENTES_LEADS_URL=https://mygest.netlify.app/api/leads
```

### Erro 401 ao acessar /leads

**Causa:** Não está autenticado

**Solução:**
1. Fazer login em `/login`
2. Acessar `/leads` novamente

## 📊 Comandos úteis

```bash
# Testar endpoint
pnpm leads:test

# Ver banco de dados
pnpm prisma:studio

# Ver logs do servidor
pnpm dev

# Limpar cache
rm -rf .next
pnpm dev

# Resetar banco (CUIDADO!)
pnpm prisma:migrate:reset
```

## 🎯 Próximos passos

Após verificar que tudo funciona:

1. ✅ Atualizar LP para produção
2. ✅ Configurar WEBHOOK_SECRET (opcional mas recomendado)
3. ✅ Testar envio real da LP
4. ✅ Implementar "Converter para Cliente" button
5. ✅ Adicionar notificações quando lead chegar
