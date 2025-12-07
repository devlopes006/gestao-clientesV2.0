# 🔄 Mobile Login Flow - O Que Deveria Acontecer

## ✅ Fluxo Esperado (Desktop/Mobile)

```
┌─────────────────────────────────────────────┐
│ 1. Usuário na página /login                 │
│    Badge: "User: null"                      │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────┐
│ 2. Clica "Continuar com Google"             │
│    Badge: "Loading: ✓"                      │
│    Em mobile: localStorage.setItem()         │
│                pendingAuthRedirect = true    │
└──────────────┬──────────────────────────────┘
               │
               ↓
         ┌─────────────┐
         │ DESKTOP?    │
         └────┬───────┘
         ┌────┴────┬──────────────────┐
         │          │                  │
        SIM       NÃO
    (popup)    (redirect)
         │        (mobile)             │
         │          │                  │
         ↓          ↓                  ↓
    ┌────────┐  ┌──────────────────────────┐
    │ Popup  │  │ Redireciona p/ Google    │
    │ Google │  │ accounts.google.com      │
    └─┬──────┘  │ Badge: "Pending: ✓"     │
      │         └──────────┬───────────────┘
      │                    │
      ↓                    ↓
    ┌─────────────────────────────────────────┐
    │ 3. Usuário Seleciona Conta Google       │
    │    Google valida credenciais            │
    └──────────────┬──────────────────────────┘
                   │
                   ↓
    ┌─────────────────────────────────────────┐
    │ 4. Google Retorna ID Token              │
    │    Em Mobile: Redireciona de volta para │
    │    app (Firebase handle redirect)       │
    └──────────────┬──────────────────────────┘
                   │
                   ↓
    ┌─────────────────────────────────────────┐
    │ 5. UserContext.checkRedirectResult()    │
    │    Chama getRedirectResult(auth)        │
    │    Firebase retorna user + idToken      │
    └──────────────┬──────────────────────────┘
                   │
                   ↓
    ┌─────────────────────────────────────────┐
    │ 6. handleAuthResult(user, inviteToken)  │
    │    Extrai idToken via getIdToken(true)  │
    │    POSTs /api/session com idToken       │
    └──────────────┬──────────────────────────┘
                   │
                   ↓
    ┌─────────────────────────────────────────┐
    │ 7. /api/session (POST)                  │
    │    - Valida idToken via Firebase Admin  │
    │    - Cria user em BD (se novo)          │
    │    - Processa convite (se existe)       │
    │    - SET cookie auth com httpOnly       │
    │    - Retorna nextPath + status          │
    └──────────────┬──────────────────────────┘
                   │
                   ↓
    ┌─────────────────────────────────────────┐
    │ 8. Cliente Recebe Response               │
    │    setUser(user)                        │
    │    localStorage.removeItem() cleanup    │
    │    Badge: "User: seu@email.com"         │
    └──────────────┬──────────────────────────┘
                   │
                   ↓
    ┌─────────────────────────────────────────┐
    │ 9. Router Redireciona                   │
    │    /dashboard ou /onboarding            │
    │    Cookie auth automáticamente           │
    │    validado em próximas requisições      │
    └─────────────────────────────────────────┘

✅ LOGIN COMPLETO
Badge: "User: seu@email.com, Loading: ✗"
```

---

## ❌ Fluxo Atual (Quebrado)

```
┌─────────────────────────────────────────┐
│ 1. Usuário na página /login             │
│    Badge: "User: null"                  │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ 2. Clica "Continuar com Google"         │
│    Badge: "Loading: ✓"                  │
│    localStorage.setItem() OK             │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ 3. Redireciona para Google               │
│    accounts.google.com/...              │
│    Badge: "Pending: ✓"                  │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ 4. Usuário Seleciona Conta Google       │
│    Google valida credenciais            │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ 5. Google Redireciona de Volta           │
│    Para: app.netlify.app/login           │
│    Com código/token no URL               │
└──────────────┬──────────────────────────┘
               │
               ↓ 🔴 PROBLEMA AQUI
┌─────────────────────────────────────────┐
│ 6. checkRedirectResult() Chamado?        │
│    SIM - getRedirectResult() retorna?    │
│    ❌ NÃO - Retorna null!                │
│    ❌ OU Error silencioso                │
│    ❌ OU Fetch falha                     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ 7. Sem usuário, sem cookie               │
│    handleAuthResult() nunca é executado  │
│    /api/session nunca é chamado          │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ 8. Component Re-renderiza                │
│    user ainda é null                    │
│    loading vira false                   │
│    Page volta para login                 │
│    Badge ainda mostra "User: null"       │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ 9. Usuário Vê Página de Login Novamente  │
│    Sem mensagem de erro                 │
│    Sem saber o que aconteceu             │
│    localStorage ainda tem flag sujo      │
└─────────────────────────────────────────┘

❌ LOGIN FALHOU (SEM MENSAGEM DE ERRO)
Badge ainda: "User: null"
```

---

## 🔍 Pontos de Falha Identificados

### Ponto A: getRedirectResult() Retorna Null

**Sintomas:**

- Badge nunca muda para user
- Fetch('/api/session') retorna 401
- Console: nenhuma mensagem de erro

**Por quê pode acontecer:**

- Firebase SDK não registrou o callback
- URL de callback não bate com Firebase config
- Sessão expirou (>1 hora)
- Storage/Cookies foram limpos

**Como diagnosticar:**

```javascript
// No console após volta do Google
console.log(
  'pendingAuthRedirect:',
  localStorage.getItem('pendingAuthRedirect'),
  'pendingInviteToken:',
  sessionStorage.getItem('pendingInviteToken')
)
// Se pendingAuthRedirect === 'true', significa que volta mas getRedirectResult falhou
```

---

### Ponto B: getIdToken() Falhando

**Sintomas:**

- getRedirectResult() retorna user
- Mas handleAuthResult() lança erro

**Por quê pode acontecer:**

- User não tem sessão válida no Firebase
- getIdToken foi chamado depois de signOut

**Como diagnosticar:**

```javascript
// No debug endpoint
fetch('/api/debug/auth-flow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: 'seu_token' }),
})
  .then((r) => r.json())
  .then(console.log)
```

---

### Ponto C: /api/session Retornando Erro

**Sintomas:**

- idToken é válido
- Mas session POST retorna 401/500

**Por quê pode acontecer:**

- Firebase Admin SDK não conseguiu validar
- Erro ao criar user em BD
- Convite com email inválido
- Rate limit

**Como diagnosticar:**

- Ver logs do servidor: `npm run dev`
- Procurar por: "[SESSION]", "[ERROR]"

---

### Ponto D: Cookies Não Sendo Salvos

**Sintomas:**

- /api/session retorna 200
- Mas document.cookie está vazio

**Por quê pode acontecer:**

- SameSite=Strict bloqueando em redirect
- Secure flag mas sem HTTPS

**Como diagnosticar:**

```javascript
document.cookie // Deve conter "auth=..."
```

---

## 🎯 Plano de Ação

### Você:

1. **Ativa debug:** `NEXT_PUBLIC_DEBUG_AUTH=true`
2. **Roda servidor:** `npm run dev`
3. **Testa em mobile:** Com `http://192.168.X.X:3000/login`
4. **Observa badge** durante todo o fluxo
5. **Executa diagnostics** após falha

### Eu:

1. **Analiso logs** que você compartilha
2. **Identifica ponto exato** da falha
3. **Implementa fix** específico
4. **Testa** para confirmar
5. **Deploy** em produção

---

## 🚀 Teste Agora Mesmo

```bash
# 1. Setup
echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local

# 2. Start server
npm run dev

# 3. Em desktop: http://localhost:3000/login (abra console)

# 4. Em mobile: http://192.168.X.X:3000/login
#    - Clique login
#    - Selecione conta
#    - Observe badge
#    - Se falhar, execute no console:

fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)

# 5. Compartilhe resultado dos passos acima
```

---

## 📞 Status

| Parte             | Status       | Notas                          |
| ----------------- | ------------ | ------------------------------ |
| Mobile Detection  | ✅ OK        | Funciona em UserContext        |
| Redirect Flow     | ✅ OK        | Redirect é executado           |
| Google OAuth      | ❓ Incerto   | Precisa testar após seleção    |
| getRedirectResult | ❓ Incerto   | Pode estar retornando null     |
| handleAuthResult  | ❓ Incerto   | Pode estar falhando silencioso |
| /api/session      | ✅ OK        | POST handler implementado      |
| Session Cookie    | ❓ Incerto   | Pode não estar sendo salvo     |
| Final Redirect    | ⏹️ Bloqueado | Depende do sucesso acima       |

**Próximo:** Seu teste em mobile vai mostrar qual etapa está quebrando! 🎯
