# 🎯 Copy-Paste Debug Commands

Este arquivo contém todos os comandos prontos para copiar-e-colar.

---

## 1️⃣ Terminal - Setup (Execute uma vez)

```bash
# Adicione ao .env.local
echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local

# Inicie servidor
npm run dev
```

**Depois:** Deixe o terminal rodando

---

## 2️⃣ Browser Desktop - Antes de Fazer Login

Abra `http://localhost:3000/login` em desktop.

Abra Console: `F12` → Console tab

Execute:

```javascript
console.log('Ready to test mobile login')
console.log('Abrindo em mobile agora...')
```

---

## 3️⃣ Browser Mobile - Fazer Login

Abra em celular (mesma rede Wi-Fi):

```
http://192.168.X.X:3000/login
```

Encontre seu IP:

```bash
# Windows
ipconfig

# Mac
ipconfig getifaddr en0

# Linux
hostname -I
```

**Procure por algo como:** `192.168.1.XXX`

---

## 4️⃣ Mobile Browser - Se Login FALHOU

### Teste A: Verificar Mobile Detection

```javascript
;/android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry|webos/i.test(
  navigator.userAgent.toLowerCase()
)

// Deve retornar: true
```

### Teste B: Verificar Session Status

```javascript
fetch('/api/session')
  .then((r) => r.json())
  .then((d) => console.log(JSON.stringify(d, null, 2)))
```

**Copie o resultado da console.**

### Teste C: Debug Endpoint

```javascript
fetch('/api/debug/auth-flow')
  .then((r) => r.json())
  .then((d) => console.log(JSON.stringify(d, null, 2)))
```

**Copie o resultado da console.**

### Teste D: Ver Cookies

```javascript
console.log('Cookies:', document.cookie)
```

**Copie se houver "auth="**

### Teste E: Ver Flags de Redirect

```javascript
console.log({
  pendingAuthRedirect: localStorage.getItem('pendingAuthRedirect'),
  pendingInviteToken: sessionStorage.getItem('pendingInviteToken'),
})
```

---

## 5️⃣ Se Quer Limpar e Tentar Novamente

```javascript
// Limpar tudo
localStorage.clear()
sessionStorage.clear()

// Deletar cookies
document.cookie.split(';').forEach((c) => {
  const eqPos = c.indexOf('=')
  const name = eqPos > -1 ? c.substring(0, eqPos) : c
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
})

// Recarregar
location.reload()
```

---

## 6️⃣ Debug Avançado - Monitorar Requisições

No celular, abra Network tab (F12):

Depois faça login e procure por:

```
POST /api/session
├─ Status: 200 ou erro?
├─ Request body: tem idToken?
└─ Response: retorna {user: ...}?

GET /api/session
└─ Status: 200 ou 401?
```

---

## 7️⃣ Se Quer Testar Token Manualmente

**Pré-requisito:** Você precisa de um idToken válido

```bash
# Não é fácil pegar um token manualmente, mas se conseguiu:

curl -X POST http://localhost:3000/api/debug/auth-flow \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "seu_token_aqui_com_pontos"
  }' \
  -b "Cookie: auth=seu_cookie" \
  | jq .
```

---

## 8️⃣ Ver Logs do Servidor em Tempo Real

Em outro terminal:

```bash
npm run dev 2>&1 | grep -i "session\|auth\|error\|debug"
```

Isso mostrará só linhas relevantes.

---

## 9️⃣ Checklist Final - Antes de Reportar

Copie e preencha:

```markdown
[ ] NEXT_PUBLIC_DEBUG_AUTH=true está em .env.local
[ ] npm run dev está rodando
[ ] Celular está na mesma rede Wi-Fi
[ ] Celular acessa http://SEU_IP:3000/login
[ ] Console do celular está aberto (F12)
[ ] Clicou em "Continuar com Google"
[ ] Selecionou conta Google
[ ] Voltou para app
[ ] Badge mostra: [PRINT AQUI]
[ ] Console mostra: [LOGS AQUI]

Resultado de:
fetch('/api/session').then(r => r.json()).then(console.log)
[RESULTADO AQUI]

Resultado de:
fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)
[RESULTADO AQUI]

Resultado de:
document.cookie
[RESULTADO AQUI]

Output do servidor (npm run dev):
[LOGS AQUI]
```

---

## 🔟 Quick Decision

### ✅ Login Funcionou!

```
Parabéns! 🎉
Não precisa fazer mais nada.
```

### ❌ Ainda Falhando?

```
1. Leia docs/MOBILE_LOGIN_QUICK_FIXES.md
2. Tente 1 fix
3. Se não funcionar, compartilhe:
   - Screenshot do badge
   - Resultados dos Testes A-E acima
   - Output do servidor
```

---

## 📝 Exemplo de Output Esperado

### Teste B Esperado (Session):

```json
{
  "user": null
}
```

Ou:

```json
{
  "user": {
    "email": "seu@email.com"
  },
  "orgId": "123",
  "role": "owner"
}
```

### Teste C Esperado (Debug):

```json
{
  "mobile": true,
  "userAgent": "Mozilla/5.0...",
  "session": {
    "user": null
  },
  "authCookie": false,
  "headers": {
    "host": "192.168.1.100:3000"
  }
}
```

### Teste D Esperado (Cookies):

```
auth=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ou vazio se não logado.

### Teste E Esperado (Flags):

```json
{
  "pendingAuthRedirect": null,
  "pendingInviteToken": null
}
```

Ou `"true"` e token string durante redirect.

---

## 🆘 Problemas Comuns

### Console Mostra: "fetch is not defined"

```
Significa: Abriu console errado
Solução: Abrir DevTools na aba correta (não em Settings)
```

### Teste B Retorna: `TypeError: Cannot read property 'json'`

```
Significa: Resposta não é JSON válido
Solução: Executar: fetch('/api/session').then(r => r.text()).then(console.log)
```

### Badge Não Aparece

```
Significa: Em produção, ou JavaScript desabilitado
Solução: Verificar que está em http://localhost:3000 ou http://IP:3000
```

### Tudo Vazio

```
Significa: Página não carregou direito
Solução: F5 para recarregar
```

---

## 💾 Salvar Resultados

Para salvar output do console:

```javascript
// Copiar todo o output
const output = {
  mobile: /android|iphone/i.test(navigator.userAgent),
  cookies: document.cookie,
  flags: {
    pendingAuthRedirect: localStorage.getItem('pendingAuthRedirect'),
    pendingInviteToken: sessionStorage.getItem('pendingInviteToken'),
  },
  timestamp: new Date().toISOString(),
}

console.log(JSON.stringify(output, null, 2))

// Depois copiar e guardar em .txt
```

---

## 🎯 Próximo Passo

1. ✅ Execute os comandos acima
2. ✅ Compartilhe resultados
3. ✅ Eu fixo baseado nos dados

**Você consegue!** 🚀
