# 🔧 Correção de Integração - Landing Page → Gestão de Clientes

## 📋 Problema Identificado

A Landing Page **Dev-Lops/lp-conversaoextrema-esther** está usando a função `enviarLead()` que envia para um endpoint simulado (`/api/leads`) ao invés do endpoint real de produção.

O código correto JÁ EXISTE no repositório (`sendLeadToGestao`), mas **NÃO está sendo usado** no componente do formulário.

---

## 🎯 Arquivos que precisam ser alterados

### 1. **components/LandingPage.tsx** (linhas 1-133)

#### ❌ Código ATUAL (ERRADO):

```tsx
// Linha 3
import { enviarLead } from '../lib/leads'

// Linhas 104-133
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setErrorMessage('')

  // ... validações ...

  setStatus('loading')
  track('lead_submit', {
    name,
    email,
    plan,
    whatsapp,
    bestTime,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
  })
  try {
    const result = await enviarLead({
      // ❌ FUNÇÃO ERRADA
      nome: name,
      email,
      telefone: whatsapp,
      plano: plan,
      melhorHorario: bestTime,
      utmSource,
      utmMedium,
      utmCampaign,
    })
    setStatus('success')
    track('lead_success', { plan, whatsapp })
    setName('')
    setEmail('')
    setPlan('')
    setWhatsapp('')
    setBestTime('')
    alert(
      '✅ Cadastro realizado com sucesso! Nossa equipe entrará em contato em breve.'
    )
  } catch (err) {
    setStatus('error')
    alert('❌ Erro ao enviar cadastro. Tente novamente.')
  }
}
```

---

#### ✅ Código CORRIGIDO (USAR ESTE):

```tsx
// Linha 3 - TROCAR O IMPORT
import { sendLeadToGestao } from '../lib/gestaoClientesAPI'

// Linhas 104-133 - TROCAR A FUNÇÃO
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setErrorMessage('')

  // ... validações ...

  setStatus('loading')
  track('lead_submit', {
    name,
    email,
    plan,
    whatsapp,
    bestTime,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
  })
  try {
    const result = await sendLeadToGestao({
      // ✅ FUNÇÃO CORRETA
      name: name,
      email: email,
      phone: whatsapp.replace(/\D/g, ''), // ✅ Normalizar telefone
      plan: plan || null,
      bestTime: bestTime || null,
      utmParams: {
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
      },
      origin: 'landing_page_conversao_extrema',
    })
    setStatus('success')
    track('lead_success', { plan, whatsapp })
    setName('')
    setEmail('')
    setPlan('')
    setWhatsapp('')
    setBestTime('')
    alert(
      '✅ Cadastro realizado com sucesso! Nossa equipe entrará em contato em breve.'
    )
  } catch (err) {
    setStatus('error')
    const errorMessage = (err as Error).message || 'Erro ao enviar cadastro'
    console.error('❌ Erro ao enviar lead:', err)
    alert(`❌ ${errorMessage}. Tente novamente.`)
  }
}
```

---

### 2. **Variáveis de Ambiente** (.env.local e Vercel)

A LP precisa ter estas variáveis configuradas:

```bash
# URL do painel de gestão (PRODUÇÃO)
GESTAO_CLIENTES_LEADS_URL=https://mygest.netlify.app/api/leads

# Secret compartilhado para validação HMAC
GESTAO_CLIENTES_WEBHOOK_SECRET=sua_chave_secreta_compartilhada

# WhatsApp (já existem)
NEXT_PUBLIC_WHATSAPP_NUMBER=5548991964517
# ... outras vars WhatsApp ...
```

---

## 🔄 Processo de Deploy

### 1. **Desenvolvimento Local**

```bash
# No repositório Dev-Lops/lp-conversaoextrema-esther

# 1. Editar components/LandingPage.tsx (linha 3 e 104-133)
# 2. Criar .env.local com as variáveis acima
# 3. Testar localmente

pnpm dev

# 4. Preencher formulário e verificar logs do console
# Deve aparecer: "[Gestão API] Enviando lead: ..."
```

---

### 2. **Configurar Vercel**

```bash
# 1. Acessar: https://vercel.com/seu-projeto/settings/environment-variables
# 2. Adicionar as 2 variáveis:

GESTAO_CLIENTES_LEADS_URL=https://mygest.netlify.app/api/leads
GESTAO_CLIENTES_WEBHOOK_SECRET=<mesma_chave_do_painel>

# 3. Redeploy após adicionar as variáveis
```

---

### 3. **Validação End-to-End**

```bash
# Testar fluxo completo:

1. Acesse: https://lp-conversaoextrema-esther.vercel.app
2. Preencha formulário com dados REAIS
3. Clique em "Enviar"
4. Abra DevTools Console (F12)
5. Deve ver: "[Gestão API] Lead enviado com sucesso: {...}"
6. Abra painel: https://mygest.netlify.app/leads
7. Lead deve aparecer na listagem
```

---

## 🚨 O que NÃO fazer

❌ **NÃO** usar `lib/leads.ts` → `enviarLead()` (endpoint simulado)  
❌ **NÃO** enviar para `http://localhost:3000/api/leads` em produção  
❌ **NÃO** usar `pages/api/submit.ts` como endpoint (usa funções internas)

---

## ✅ O que FAZER

✅ **SIM** usar `lib/gestaoClientesAPI.ts` → `sendLeadToGestao()`  
✅ **SIM** enviar para `https://mygest.netlify.app/api/leads`  
✅ **SIM** incluir assinatura HMAC (`X-Webhook-Signature`)  
✅ **SIM** normalizar telefone antes de enviar (`.replace(/\D/g, '')`)

---

## 📊 Comparação de Payloads

### ❌ Payload ERRADO (função antiga):

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "48991964517",
  "plan": null,
  "bestTime": null,
  "utmSource": null,
  "utmMedium": null,
  "utmCampaign": null,
  "origin": "landing-page",
  "timestamp": "2025-12-20T..."
}
```

→ Vai para `/api/leads` (simulado, não cria cliente real)

---

### ✅ Payload CORRETO (função nova):

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "5548991964517",
  "plan": "Premium",
  "bestTime": "Manhã",
  "utmParams": {
    "utm_source": "facebook",
    "utm_medium": "cpc",
    "utm_campaign": "jan2025"
  },
  "origin": "landing_page_conversao_extrema"
}
```

**Headers:**

```
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...
```

→ Vai para `https://mygest.netlify.app/api/leads` (cria cliente real no Firestore)

---

## 🔐 Como gerar/verificar HMAC Secret

```bash
# 1. Gerar nova secret (caso não tenha):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Adicionar no PAINEL (.env no Netlify):
GESTAO_CLIENTES_WEBHOOK_SECRET=<valor_gerado>

# 3. Adicionar na LP (.env.local + Vercel):
GESTAO_CLIENTES_WEBHOOK_SECRET=<mesmo_valor>
```

---

## 🧪 Script de Teste (OPCIONAL)

Criar arquivo `test-lp-to-panel.mjs` na raiz da LP:

```javascript
import crypto from 'crypto'

const url = 'https://mygest.netlify.app/api/leads'
const secret = process.env.GESTAO_CLIENTES_WEBHOOK_SECRET || 'sua_chave_aqui'

const payload = JSON.stringify({
  name: 'Teste LP Integração',
  email: 'teste@lp.com',
  phone: '5548999999999',
  plan: 'Teste',
  bestTime: 'Agora',
  utmParams: {
    utm_source: 'test',
    utm_medium: 'script',
    utm_campaign: 'integration',
  },
  origin: 'landing_page_conversao_extrema',
})

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex')

console.log('🔄 Enviando lead de teste...')
console.log('URL:', url)
console.log('Payload:', payload)
console.log('Signature:', `sha256=${signature}`)

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': `sha256=${signature}`,
  },
  body: payload,
})

const result = await response.json()
console.log('📨 Resposta:', response.status, result)

if (result.success) {
  console.log('✅ SUCESSO! Cliente criado com ID:', result.clientId)
  console.log('🔗 Verifique em: https://mygest.netlify.app/leads')
} else {
  console.error('❌ ERRO:', result.error)
}
```

**Rodar:**

```bash
node test-lp-to-panel.mjs
```

---

## 📝 Checklist Final

- [ ] Editei `components/LandingPage.tsx` (import + handleSubmit)
- [ ] Configurei variáveis `.env.local` (desenvolvimento)
- [ ] Testei localmente com `pnpm dev`
- [ ] Adicionei variáveis no Vercel
- [ ] Fiz redeploy da LP
- [ ] Testei formulário em produção
- [ ] Verifiquei lead aparecendo em `/leads` do painel
- [ ] Confirmei mensagem WhatsApp chegando (se configurado)

---

## 🆘 Troubleshooting

### Erro: "GESTAO_CLIENTES_LEADS_URL ou SECRET não configurados"

→ Adicionar variáveis de ambiente no Vercel e fazer redeploy

### Erro: "Erro ao enviar lead: 401"

→ Secret não corresponde entre LP e Painel, verificar `.env`

### Erro: "Erro ao enviar lead: 500"

→ Verificar logs do Netlify em `https://app.netlify.com/sites/mygest/logs`

### Lead não aparece na listagem

→ Verificar filtro `status='lead'` e `deletedAt=null` na tela `/leads`

### Console mostra sucesso mas nada acontece

→ Verificar se ainda está usando `enviarLead()` ao invés de `sendLeadToGestao()`

---

## 📞 Próximos Passos

Após aplicar esta correção:

1. **Teste A/B**: Comparar taxa de conversão antes/depois
2. **Monitoramento**: Verificar logs do Netlify Functions
3. **Analytics**: Acompanhar leads em tempo real em `/leads`
4. **WhatsApp**: Confirmar mensagens automáticas funcionando
5. **Otimizações**: Adicionar loading states, success modals

---

## ✅ Resumo da Correção

| Antes (❌ ERRADO)        | Depois (✅ CORRETO)                        |
| ------------------------ | ------------------------------------------ |
| `import { enviarLead }`  | `import { sendLeadToGestao }`              |
| Endpoint simulado        | Endpoint real do painel                    |
| Sem assinatura HMAC      | Com assinatura HMAC                        |
| Telefone com formatação  | Telefone normalizado (só números)          |
| `origin: 'landing-page'` | `origin: 'landing_page_conversao_extrema'` |
| Lead NÃO criado          | Lead CRIADO no Firestore ✅                |

---

**📌 Importante**: Após fazer as alterações, SEMPRE testar end-to-end antes de considerar pronto!
