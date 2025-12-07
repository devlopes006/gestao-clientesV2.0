# 🔧 Mobile Login Debug - Quick Reference

## 1️⃣ Setup (Execute UMA VEZ)

```bash
# Adicionar flag de debug em .env.local
echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local

# Ou editar .env.local manualmente:
# NEXT_PUBLIC_DEBUG_AUTH=true

# Iniciar servidor
npm run dev
```

---

## 2️⃣ Testar em Desktop

```
http://localhost:3000/login
```

**Abra Console (F12):**

```
Ctrl+Shift+I (Windows)
Cmd+Opt+I (Mac)
```

Procure por logs com `[DEBUG]`:

```
[DEBUG] UserContext: setUser
[DEBUG] UserContext: sessão OK
```

---

## 3️⃣ Testar em Mobile (Mesmo Wi-Fi)

**Encontre seu IP:**

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig

# Ou mais fácil:
npm run dev  # Vê algo como "ready on http://localhost:3000"
```

**No celular:**

```
http://SEU_IP:3000/login
```

**Abra Console do navegador:**

```
iPhone Safari: Settings → Advanced → Web Inspector
Android Chrome: Menu → Settings → Developer Tools
```

---

## 4️⃣ Durante o Login

### Observe o Badge (canto inferior direito):

```
📱 Mobile: ✓ (deve ser verde)
⏳ Loading: ✗ (deve ficar ✓ durante OAuth)
👤 User: null (deve mudar para email após login)
⏸️ Pending Redirect: ✗ (fica ✓ durante redirect do Google)
🎁 Has Invite: ✗ (só se tiver convite)
```

### Observe o Console:

```
[DEBUG] UserContext: setUser {uid: "abc123", email: "seu@email.com"}
[DEBUG] UserContext: sessão OK
```

---

## 5️⃣ Se Falhar - Diagnosticar

### A. Verificar Mobile Detection

```javascript
// No console do celular
;/android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry|webos/i.test(
  navigator.userAgent.toLowerCase()
)

// Deve retornar: true

// Se retornar false, adicionar user agent ao teste
navigator.userAgent
```

### B. Verificar Session Status

```javascript
// No console do celular
fetch('/api/session')
  .then((r) => r.json())
  .then((d) => {
    console.log('Status:', r.status)
    console.log('Data:', d)
  })

// Esperado:
// {user: null}  (se não logado)
// {user: {email: "..."}, orgId: "..."} (se logado)
```

### C. Testar Debug API

```javascript
// No console do celular - ver estado completo
fetch('/api/debug/auth-flow')
  .then((r) => r.json())
  .then((d) => console.log(JSON.stringify(d, null, 2)))

// Esperado:
// {
//   mobile: true,
//   session: {user: null ou {email: "..."}},
//   authCookie: false ou true,
//   ...
// }
```

### D. Verificar Cookies

```javascript
// No console do celular
document.cookie

// Deve conter algo tipo:
// "auth=eyJhbGciOiJSUzI1NiIs..."
// Se vazio, cookies não estão sendo salvos
```

### E. Verificar Redirect Flag

```javascript
// No console DURANTE o OAuth (enquanto está em accounts.google.com)
localStorage.getItem('pendingAuthRedirect')
// Deve ser: "true"

// APÓS voltar da Google
localStorage.getItem('pendingAuthRedirect')
// Deve ser: null (foi limpo)
```

### F. Ver Logs do Servidor

```bash
# Em outro terminal, rodando npm run dev
# Procure por linhas como:

[SESSION] validating idToken
[SESSION] user found
[SESSION] cookie set
[ERROR] ...
```

---

## 6️⃣ Compartilhar Resultado

Tire screenshot/print dos seguintes:

1. **Badge final** (canto inferior direito após login falhar)
2. **Console logs** (F12 → Console)
3. **Resultado de:**
   ```javascript
   fetch('/api/debug/auth-flow')
     .then((r) => r.json())
     .then(console.log)
   ```
4. **Resultado de:**
   ```javascript
   document.cookie
   ```
5. **Output do servidor** (`npm run dev`)

---

## 📋 Checklist Rápido

- [ ] `.env.local` tem `NEXT_PUBLIC_DEBUG_AUTH=true`
- [ ] `npm run dev` está rodando
- [ ] Celular na mesma rede Wi-Fi
- [ ] Acessou `http://SEU_IP:3000/login` no celular
- [ ] Console do navegador está aberto (F12)
- [ ] Clicou em "Continuar com Google"
- [ ] Observou badge mudando para "⏸️ Pending: ✓"
- [ ] Selecionou conta Google
- [ ] Esperou voltar para app
- [ ] Badge ainda mostra "User: null" (falha) OU "User: email" (sucesso)
- [ ] Capturou screenshot do badge
- [ ] Capturou logs do console
- [ ] Executou os 3 fetch commands acima
- [ ] Compartilhou resultados

---

## 🎯 O Que Esperar

### ✅ Sucesso

```
Badge mostrará:
📱 Mobile: ✓
👤 User: seu@email.com
⏳ Loading: ✗

Console mostrará:
[DEBUG] UserContext: setUser {email: "seu@email.com"}
[DEBUG] UserContext: sessão OK

App redirecionará para dashboard
```

### ❌ Falha

```
Badge mostrará:
📱 Mobile: ✓
👤 User: null
⏳ Loading: ✗

Console pode mostrar:
[DEBUG] UserContext: Iniciando checkRedirectResult
(nada depois)

OU

[ERROR] Falha ao criar sessão

fetch('/api/session') retornará 401/500
```

---

## 💡 Dicas

### Se Login Está "Travado":

```javascript
// Limpar estados sujos
localStorage.removeItem('pendingAuthRedirect')
sessionStorage.removeItem('pendingInviteToken')
document.location.reload()
```

### Se Quer Ver Todo o Fluxo:

```javascript
// Log em cada etapa
localStorage.setItem(
  'debug_timestamps',
  JSON.stringify({
    inicio: Date.now(),
  })
)
```

### Se Tem Muito Logs:

```bash
# Filtrar só debug
npm run dev 2>&1 | grep DEBUG
```

### Se Quer Testar Session API Manualmente:

```bash
# Terminal
curl http://localhost:3000/api/session

# Deve retornar:
# {"user": null}
```

---

## 🚨 Problemas Comuns

| Problema             | Solução                                                |
| -------------------- | ------------------------------------------------------ |
| Badge não mostra     | Recarregar página (F5)                                 |
| Console vazio        | Abrir F12 ANTES de fazer login                         |
| Logs são inglês      | Normal, é código de debug em EN                        |
| Mobile retorna false | Usar `window.innerWidth < 768` ou atualizar user-agent |
| Cookies vazio        | `npm run dev` parou ou em HTTPS sem Secure:false       |

---

## 📞 Need Help?

1. Leia `docs/MOBILE_LOGIN_TESTING.md` (guia completo)
2. Leia `docs/MOBILE_LOGIN_TROUBLESHOOTING.md` (soluções específicas)
3. Verifique `docs/MOBILE_LOGIN_FLOWCHART.md` (entender fluxo)
4. Compartilhe os prints dos passos acima

**Com essas informações, conseguiremos debug rapidamente!** 🚀
