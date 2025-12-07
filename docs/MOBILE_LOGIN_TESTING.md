# 📱 Testes de Mobile Login - Como Executar

## ⚡ Quick Start - Teste Agora

### Passo 1: Ativar Debug Mode

```bash
# Adicione ao seu .env.local
NEXT_PUBLIC_DEBUG_AUTH=true

# Depois rode
npm run dev
```

### Passo 2: Testar em Mobile

1. Em desktop, abra: `http://localhost:3000/login`
2. Abra DevTools (F12)
3. Go to Console tab - verá logs do processo de login
4. No seu celular (mesmo Wi-Fi), abra app no seu IP:
   ```
   http://192.168.X.X:3000/login
   ```
   (Encontre seu IP: `ipconfig` no Windows ou `ifconfig` no Mac/Linux)

### Passo 3: Executar Login em Mobile

1. Clique "Continuar com Google"
2. Selecione conta Google
3. Observe:
   - **Badge no canto inferior direito** mostra:
     - 📱 Detectado mobile? (✓ ou ✗)
     - ⏳ Carregando? (✓ ou ✗)
     - 👤 User: seu@email.com (após sucesso)
     - ⏸️ Pending Redirect: ✓ (durante OAuth)
     - 🎁 Has Invite: ✓ (se com convite)
   - **No console do browser** verá logs como:
     ```
     [DEBUG] UserContext: Iniciando checkRedirectResult
     [DEBUG] UserContext: getRedirectResult retornou user
     [DEBUG] UserContext: setUser
     [DEBUG] UserContext: sessão OK
     ```

---

## 🐛 Se o Login Falhar

### Teste 1: Verificar Detecção de Mobile

No console do celular, execute:

```javascript
// Deve retornar true
;/android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry|webos/i.test(
  navigator.userAgent.toLowerCase()
)

// Ou verificar o badge (canto inferior direito) - deve mostrar 📱✓
```

### Teste 2: Verificar Session API

No console do celular após logout, execute:

```javascript
fetch('/api/session')
  .then((r) => r.json())
  .then(console.log)
```

**Esperado:** Retorna `{user: null}` (não logado) ou `{user: {...}, orgId: "...", role: "..."}`

### Teste 3: Testar Debug Endpoint

No console:

```javascript
fetch('/api/debug/auth-flow')
  .then((r) => r.json())
  .then((d) => console.log(JSON.stringify(d, null, 2)))
```

**Esperado:** Mostra:

```json
{
  "mobile": true,
  "userAgent": "...",
  "session": { "user": null },
  "authCookie": false,
  "headers": { "host": "...", "user-agent": "..." }
}
```

### Teste 4: Verificar Cookies

No console:

```javascript
// Ver todos os cookies
document.cookie

// Deve conter algo como:
// "auth=eyJhbGciOiJSUzI1NiIs..."
```

---

## 🚨 Possíveis Problemas

### ❌ Problema: Volta para login após OAuth

**Possíveis causas:**

1. ✅ CSP bloqueando callback Google
2. ✅ Cookie não sendo salvado (SameSite=Strict em HTTPS requerido)
3. ✅ Session API retornando erro 401/500
4. ✅ Firebase getRedirectResult() retornando null

**Diagnosticar:**

```javascript
// 1. Verificar CSP errors
// Console: procure por "Refused to frame" ou "Content Security Policy"

// 2. Verificar cookies
document.cookie // "auth" deve estar presente

// 3. Testar session API
fetch('/api/session')
  .then((r) => {
    console.log('Status:', r.status)
    return r.json()
  })
  .then(console.log)

// 4. Ver se Firebase retornou resultado
// Verificar console logs com NEXT_PUBLIC_DEBUG_AUTH=true
```

### ❌ Problema: Erro "Falha ao criar sessão"

**Causas:**

1. ✅ idToken expirou
2. ✅ Firebase Admin SDK não conseguiu validar
3. ✅ Database error ao criar user
4. ✅ Convite com email inválido

**Diagnosticar:**

```bash
# Ver logs do servidor
npm run dev  # e observe output do terminal
```

### ❌ Problema: Login funciona em desktop mas não mobile

**Possíveis causas:**

1. ✅ CSP mais restritivo em mobile
2. ✅ SameSite cookies não funciona em redirect
3. ✅ User-Agent não sendo detectado como mobile
4. ✅ Cache do navegador

**Solução:**

```javascript
// Limpar cache e localStorage
localStorage.clear()
sessionStorage.clear()
// F5 para recarregar
```

---

## 📋 Checklist de Debug

- [ ] NEXT_PUBLIC_DEBUG_AUTH=true está em .env.local
- [ ] `npm run dev` está rodando
- [ ] Celular está na mesma rede que desktop
- [ ] Badge verde (📱✓) aparece no canto inferior direito
- [ ] Console não mostra erro de CSP
- [ ] Cookies contêm "auth="
- [ ] Session API retorna user (não null)
- [ ] Debug logs aparecem no console com "[DEBUG]"

---

## 🔗 Verificar Logs do Servidor

Em outro terminal, monitore os logs do servidor:

```bash
npm run dev 2>&1 | grep -i "session\|auth\|error"
```

Isso vai mostrar:

```
[SESSION] validating idToken
[SESSION] user found: abc@example.com
[SESSION] cookie set
```

Se não aparecer nada, é porque a requisição nem chegou no servidor.

---

## 📞 Report Checklist

Quando testar, compartilhe:

1. **Print do badge** (canto inferior direito durante login)
2. **Logs do console** (F12 → Console tab)
3. **Resultado de:** `fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)`
4. **Resultado de:** `document.cookie`
5. **Resultado de:** `fetch('/api/session').then(r => r.json()).then(console.log)`

Isso vai ajudar a identificar exatamente onde está falhando!
