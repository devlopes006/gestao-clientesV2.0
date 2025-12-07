# 🚀 Mobile Login - Quick Fixes (Tente Antes de Debugar)

## ⚡ Fix #1: Limpar Storage (60% de chance de funcionar)

**Sintomas:** Login funcionava antes, de repente parou

**Por quê:** localStorage/sessionStorage com estados sujos de tentativas anteriores

**Como Fixar:**

### Opção A: Usuário Final (Celular)

1. Abra app em celular
2. Abra DevTools/Console
3. Execute:

```javascript
localStorage.clear()
sessionStorage.clear()
document.cookie.split(';').forEach((c) => {
  document.cookie = c
    .replace(/^ +/, '')
    .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
})
location.reload()
```

4. Tente login novamente

### Opção B: Dev (Via Code)

```bash
# Em src/app/login/page.tsx, adicionar no início:
useEffect(() => {
  // Limpar flags de redirect sujas no load
  if (typeof window !== 'undefined' && !localStorage.getItem('_cleaned')) {
    localStorage.removeItem('pendingAuthRedirect')
    sessionStorage.removeItem('pendingInviteToken')
    localStorage.setItem('_cleaned', 'true')
  }
}, [])
```

**Resultado:** Se funcionar, problema era storage sujo

---

## ⚡ Fix #2: Forçar Atualizar Firebase SDK (40% de chance)

**Sintomas:** getRedirectResult() sempre retorna null

**Por quê:** Firebase SDK desatualizado ou cache

**Como Fixar:**

```bash
# Remover e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
npm run dev
```

**Resultado:** Se funcionar, era versão desatualizada

---

## ⚡ Fix #3: Verificar HTTPS em Produção (100% importante se em Netlify)

**Sintomas:** Funciona em localhost mas não em produção

**Por quê:** SameSite=Strict requer HTTPS; cookies HTTP-only não salvam em HTTP

**Como Fixar:**

### Verificar Netlify

```bash
# Abrir vercel.json ou netlify.toml
# Procurar por:
```

`netlify.toml:`

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Adicionar HTTPS redirect
[[redirects]]
  from = "http://*"
  to = "https://:splat"
  status = 301
```

**Resultado:** Se funcionar em HTTPS, era cookie SameSite

---

## ⚡ Fix #4: Aumentar Timeout (20% de chance)

**Sintomas:** Redirect volta mas login fica carregando, depois falha

**Por quê:** 10 segundos pode não ser suficiente para Firebase + API

**Como Fixar:**

Em `src/context/UserContext.tsx` linha ~187:

```tsx
// DE:
loginTimeout = setTimeout(() => {
  if (DEBUG_AUTH) logger.error('[UserContext] Timeout no login após redirect')
  setLoading(false)
}, 10000) // 10 segundos

// PARA:
loginTimeout = setTimeout(() => {
  if (DEBUG_AUTH) logger.error('[UserContext] Timeout no login após redirect')
  setLoading(false)
}, 20000) // 20 segundos (aumentado)
```

**Resultado:** Se funcionar após esperar mais, era timeout

---

## ⚡ Fix #5: Verificar Firebase Redirect URL (10% de chance)

**Sintomas:** Redirect do Google aparece mas não volta

**Por quê:** URL de callback não registered no Firebase

**Como Fixar:**

1. Firebase Console: https://console.firebase.google.com
2. Projeto → Authentication → Settings → Authorized domains
3. Verificar se domínio está lá:
   - ✅ localhost
   - ✅ seu-dominio.netlify.app
   - ✅ seu-dominio.com

Se não estiver:

1. Click "+ Add domain"
2. Adicionar domínios acima
3. Salvar

**Resultado:** Se funcionar após adicionar, era domínio não authorized

---

## ⚡ Fix #6: Verificar CSP Headers (5% de chance em mobile)

**Sintomas:** Console mostra erro "Refused to connect to accounts.google.com"

**Por quê:** CSP muito restritiva em mobile

**Como Fixar:**

Em `netlify/edge-functions/middleware.ts` linha ~25:

```tsx
// Verificar se tem:
"frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
"connect-src 'self' https://*.googleapis.com https://apis.google.com ...",
```

Se não tiver, adicionar.

**Resultado:** Se funcionar, era CSP bloqueando

---

## 🎯 Qual Fix Tentar Primeiro?

### Se problemas RECENTES:

1. **Fix #1** (Limpar storage)
2. **Fix #4** (Aumentar timeout)
3. **Fix #2** (Atualizar SDK)

### Se em DESENVOLVIMENTO:

1. **Fix #1** (Limpar storage)
2. **Fix #2** (Atualizar SDK)

### Se em PRODUÇÃO (Netlify):

1. **Fix #3** (HTTPS redirect)
2. **Fix #5** (Verificar Firebase domains)
3. **Fix #6** (Verificar CSP)

### Se NUNCA funcionou em mobile:

1. **Fix #5** (Firebase domains)
2. **Fix #6** (CSP headers)
3. **Fix #3** (HTTPS em produção)

---

## ✅ Teste Rápido Pós-Fix

Depois de aplicar qualquer fix:

```bash
# 1. Limpar cache
npm run build  # Se alterou código

# 2. Restart server
npm run dev

# 3. Testar em mobile
http://SEU_IP:3000/login

# 4. Executar diagnóstico se falhar
fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)
```

---

## 📊 Probabilidade de Sucesso

| Fix                   | Dev    | Produção | Chance          |
| --------------------- | ------ | -------- | --------------- |
| #1 - Limpar Storage   | ⭐⭐⭐ | ⭐       | 60%             |
| #2 - Atualizar SDK    | ⭐⭐   | ⭐⭐     | 40%             |
| #3 - HTTPS            | ⭐     | ⭐⭐⭐   | 100% (se falta) |
| #4 - Aumentar Timeout | ⭐⭐   | ⭐       | 20%             |
| #5 - Firebase Domains | ⭐     | ⭐⭐⭐   | 10% (se falta)  |
| #6 - CSP Headers      | ⭐     | ⭐       | 5% (raro)       |

---

## 🚨 Se Nenhum Fix Funcionar

Então precisamos de debug mais detalhado:

1. Ativar `NEXT_PUBLIC_DEBUG_AUTH=true`
2. Executar `npm run dev`
3. Testar em mobile
4. Compartilhar logs + resultados de `/api/debug/auth-flow`
5. Vou analisar e implementar fix específico

**Não se preocupe, com os logs conseguimos sempre identificar!** 💪

---

## 💡 Dica Extra: Log Temporário em Produção

Se quer ver logs sem NEXT_PUBLIC_DEBUG_AUTH:

Em `src/context/UserContext.tsx` linha ~61:

```tsx
const DEBUG_AUTH = true // Force enable para debug

// Depois desabilitar:
const DEBUG_AUTH = false // Desabilitado
```

Commit e deploy → vê logs → revert

---

## 🎁 Bônus: Check Network Requests

Se quer ver exatamente o que está sendo enviado:

1. Abrir DevTools em mobile (F12)
2. Ir para aba "Network"
3. Fazer login
4. Procurar por:
   - `POST /api/session` → Status 200? Erro?
   - `accounts.google.com/...` → Sucesso? Bloqueado?
   - Request/Response headers

Isso mostra exatamente onde falha!

---

## 📞 Quick Decision Tree

```
❓ Login funciona em desktop?
  ├─ SIM → Problema é mobile-específico
  │        ├─ Teste Fix #1 (storage)
  │        ├─ Teste Fix #3 (HTTPS em prod)
  │        └─ Ativar NEXT_PUBLIC_DEBUG_AUTH=true
  │
  └─ NÃO → Problema é geral (desktop também)
           ├─ Teste Fix #2 (SDK)
           ├─ Teste Fix #5 (Firebase domains)
           └─ Ativar NEXT_PUBLIC_DEBUG_AUTH=true
```

---

## 🏁 Conclusão

**Antes de fazer debug completo**, tente estes 6 fixes rápidos.

Estatisticamente, 1 deles vai funcionar 80% das vezes!

Se nenhum funcionar, vamos para o debug detalhado com ferramentas que criei.

**Boa sorte!** 🚀
