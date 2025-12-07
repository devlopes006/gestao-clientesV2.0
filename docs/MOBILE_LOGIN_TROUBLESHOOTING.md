# 🎯 Mobile Login - Possíveis Problemas e Soluções

## Problema 1: "Volta para tela de login após selecionar conta Google"

**Sintomas:**

- Clica em "Continuar com Google"
- Abre tela de seleção de conta
- Seleciona conta
- Volta para página de login (não faz login)
- Nenhuma mensagem de erro

**Causas Prováveis (em ordem de probabilidade):**

### 🔴 Causa 1: getRedirectResult() retornando null

**Por quê?** Firebase pode não ter registrado o callback corretamente
**Como testar:**

```javascript
// No console, após voltar do Google
fetch('/api/debug/auth-flow')
  .then((r) => r.json())
  .then(console.log)
// Se "session.user": null e "authCookie": false → getRedirectResult falhou
```

**Solução:**

- Limpar localStorage/sessionStorage
- Limpar cookies do navegador
- Tentar login novamente
- Se persistir, pode ser Firebase SDK desatualizado

### 🔴 Causa 2: Session API retornando erro 401/500

**Por quê?** idToken expirou ou há erro no servidor
**Como testar:**

```javascript
// No console após volta do Google
fetch('/api/session')
  .then((r) => {
    console.log('Status:', r.status)
    return r.json()
  })
  .then(console.log)
```

**Solução:**

- Verificar logs do servidor: `npm run dev` (veja output)
- Verificar Firebase Admin SDK está correto
- Se erro de validação, pode ser timezone do servidor diferente

### 🔴 Causa 3: Cookies não sendo salvos (SameSite=Strict)

**Por quê?** Redirect cross-domain com SameSite=Strict
**Como testar:**

```javascript
document.cookie // "auth=" deve estar presente
// Se vazio, cookies não estão sendo salvos
```

**Solução:**

- Em desenvolvimento: cookies devem funcionar em localhost
- Em produção: verificar se HTTPS está ativado (requerido para SameSite=Strict)
- Verificar netlify.toml se tem HTTPS redirect

### 🔴 Causa 4: CSP bloqueando callback do Google

**Por quê?** Content Security Policy muito restritiva
**Sintomas:** Error no console "Refused to connect to..."
**Como testar:**

- F12 → Console, procure por erro CSP
- Ou execute: `localStorage.getItem('csp-errors')`
  **Solução:**
- Verificar netlify/edge-functions/middleware.ts
- Garantir que `https://accounts.google.com` está em `frame-src`
- Garantir que Google APIs estão em `connect-src`

---

## Problema 2: "Login funciona em desktop mas não em mobile"

**Causas Específicas:**

### 🔴 Não está detectando como mobile

**Como testar:**

- Badge no canto inferior direito deve mostrar 📱✓
- Ou execute no console: `/android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry|webos/i.test(navigator.userAgent.toLowerCase())`
  **Solução:**
- Adicionar user-agent ao teste if
- Ou usar `window.innerWidth < 768` como fallback

### 🔴 Usando popup ao invés de redirect

**Sintomas:**

- Popup é bloqueado em mobile
- Nenhuma tela de Google aparece
  **Como verificar:**
- Verificar UserContext.tsx linha ~275
- Deve chamar `signInWithRedirect` para mobile (não `signInWithPopup`)
  **Solução:**
- Garantir isMobileDevice() está sendo chamado
- Verificar se localStorage.setItem("pendingAuthRedirect", "true") está sendo executado

---

## Problema 3: "Erro ao enviar credenciais"

**Sintomas:**

- Login parecia estar funcionando
- De repente começou a falhar
- Status 401 ou 500

**Causas Possíveis:**

### 🔴 Firebase Admin SDK desatualizado

**Solução:**

```bash
npm list firebase-admin
npm install firebase-admin@latest
```

### 🔴 Variáveis de ambiente faltando

**Solução:**

```bash
# Verificar se está em .env ou .env.local
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

### 🔴 Timeout na session API

**Solução:**

- Aumentar timeout em src/app/api/session/route.ts
- Verificar Prisma connection string
- Verificar Firestore está acessível

---

## Problema 4: "Mobile login funciona 1x, depois para de funcionar"

**Sintomas:**

- Primeiro login OK
- Segundo login na mesma sessão falha
- Fazer refresh resolve temporariamente

**Causas:**

### 🔴 Token reuse rate limit

**Solução:**

```javascript
// Garantir que handleAuthResult é chamado apenas 1x
// Verificar se useEffect em UserContext tem dependências corretas
```

### 🔴 localStorage.setItem ("pendingAuthRedirect") não sendo removido

**Solução:**

```javascript
localStorage.removeItem('pendingAuthRedirect')
sessionStorage.removeItem('pendingInviteToken')
// Depois tentar login novamente
```

---

## Checklist de Testes

Execute nesta ordem:

### ✅ Teste 1: Verificar Setup

```bash
npm run dev
# Servidor deve iniciar sem erros
```

### ✅ Teste 2: Verificar Mobile Detection

No console do celular:

```javascript
;/android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry|webos/i.test(
  navigator.userAgent.toLowerCase()
)
// Deve retornar: true
```

### ✅ Teste 3: Iniciar Login

1. Clique "Continuar com Google"
2. Observe badge: deve mostrar `⏸️ Pending Redirect: ✓`
3. Selecione conta Google
4. Espere redirect voltar

### ✅ Teste 4: Após Redirect

No console:

```javascript
localStorage.getItem('pendingAuthRedirect') // Deve ser null (foi limpo)
document.cookie // Deve conter "auth="
```

### ✅ Teste 5: Testar Session

```javascript
fetch('/api/session')
  .then((r) => r.json())
  .then(console.log)
// Deve retornar: {user: {email: "seu@email.com"}, orgId: "...", role: "..."}
```

### ✅ Teste 6: Verificar Debug Endpoint

```javascript
fetch('/api/debug/auth-flow')
  .then((r) => r.json())
  .then((d) => console.log(JSON.stringify(d, null, 2)))
// Esperado: mobile: true, authCookie: true, session.user: {email: "..."}
```

---

## Erro Específicos e Soluções

### ❌ "Invalid token"

**Causa:** idToken expirou ou é inválido
**Solução:**

```javascript
// No UserContext, getIdToken é chamado com true (force refresh)
await firebaseUser.getIdToken(true)
```

### ❌ "User not found in database"

**Causa:** Primeiro login e onboarding falhou
**Solução:**

- Verificar logs de Prisma
- Verificar se BD está acessível
- Tentar criar user manualmente em BD

### ❌ "Invite email mismatch"

**Causa:** Email do convite não bate com email Google
**Solução:**

- Verificar email no convite
- Fazer login com mesmo email do convite
- Ou fazer login sem convite primeiro

### ❌ "CORS error"

**Causa:** Requisição está sendo bloqueada por CORS
**Solução:**

- Em produção: verificar netlify.toml tem CORS headers
- Em desenvolvimento: DevTools mostra qual header está faltando
- Adicionar à CSP em middleware.ts

---

## Debug Avançado

### 🔬 Ver Logs do Servidor em Tempo Real

```bash
npm run dev 2>&1 | grep -i "session\|auth\|error"
```

### 🔬 Monitorar Cookies Sendo Set

```javascript
// No console, antes de fazer login
Object.defineProperty(document, 'cookie', {
  set: function (cookie) {
    console.log('[COOKIE SET]', cookie)
    return true
  },
  get: function () {
    return document.cookie
  },
})
```

### 🔬 Monitorar Requisições de Rede

```javascript
// Abrir DevTools → Network → fazer login
// Procurar por:
// - POST /api/session (deve retornar 200)
// - GET /profile (pode retornar 401 se não autenticado)
// - Callback do Google
```

### 🔬 Testar Firebase Diretamente

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithRedirect, getRedirectResult } from 'firebase/auth'

const auth = getAuth()
// Verificar se getRedirectResult retorna user
getRedirectResult(auth).then(console.log)
```

---

## Próximos Passos

1. **Ative NEXT_PUBLIC_DEBUG_AUTH=true** em .env.local
2. **Execute npm run dev**
3. **Teste login em mobile** com os testes acima
4. **Compartilhe:**
   - Screenshot do badge
   - Logs do console com [DEBUG]
   - Resultado dos comandos JavaScript
   - Output do terminal (npm run dev)

Com essas informações, conseguiremos identificar exatamente onde o fluxo está quebrando!
