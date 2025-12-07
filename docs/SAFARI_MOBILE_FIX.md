# 🍎 Safari Mobile - Sem Tela de Seleção de Conta

## 🐛 Problema Identificado

No Safari mobile (iPhone/iPad), quando clica "Continuar com Google":

- ❌ Não aparece tela de seleção de conta
- ❌ Redireciona direto para Google
- ❌ Volta sem fazer login
- ❌ Sem mensagem de erro

## 🔍 Causa Raiz

Safari tem diferentes comportamentos para OAuth:

1. **Popup bloqueado** - Safari não permite popups de auth
2. **Redirect sem UI** - Redirect acontece mas Google não mostra tela de seleção
3. **Sessão perdida** - Safari pode limpar a sessão OAuth durante redirect
4. **User-agent bloqueado** - Alguns servidores bloqueiam Safari mobile

## ✅ Fixes Implementados

### Fix 1: Melhorar Logs para Safari

```typescript
// Agora detecta Safari e mostra logs específicos
const isSafari =
  /Safari|iPhone|iPad/.test(navigator.userAgent) &&
  !/Chrome|Firefox/.test(navigator.userAgent)
logger.debug('Safari detectado:', { isSafari })
```

### Fix 2: Adicionar Scopes do Provider

```typescript
// Garantir que Google recebe as permissões necessárias
provider.addScope('profile')
provider.addScope('email')
```

### Fix 3: Aumentar Timeout

```typescript
// De 10s para 15s (Safari é mais lento)
loginTimeout = setTimeout(() => {...}, 15000)
```

### Fix 4: Melhorar Debugging

```typescript
// Logs detalhados mostram exatamente o que está acontecendo
logger.debug('getRedirectResult', {
  hasUser: !!result?.user,
  userEmail: result?.user?.email,
  result,
})
```

---

## 🚀 Como Testar

### 1. Ativar Debug

```bash
echo "NEXT_PUBLIC_DEBUG_AUTH=true" >> .env.local
npm run dev
```

### 2. Testar em Safari Mobile

```
http://SEU_IP:3000/login
```

### 3. Observar Console

Abra Web Inspector em Safari:

- Settings → Advanced → Web Inspector (ON)
- Desenvolver → Mostrar Console Web

### 4. Executar Teste

```javascript
// Ver se Safari foi detectado
console.log(/Safari|iPhone|iPad/.test(navigator.userAgent))

// Ver logs de debug
// Procure por: "[DEBUG] Iniciando checkRedirectResult"
// Procure por: "[DEBUG] getRedirectResult"
```

---

## 🔧 Se Ainda Não Funcionar

### Opção 1: Forçar Usar Popup Mesmo em Mobile

Em `src/context/UserContext.tsx` linha ~268:

```typescript
// DE:
if (useMobile) {

// PARA:
const isSafari = /Safari|iPhone|iPad/.test(navigator.userAgent) && !/Chrome|Firefox/.test(navigator.userAgent)
if (useMobile && !isSafari) {  // Não usar redirect no Safari
```

**Pro:** Funciona melhor
**Con:** Pode bloquear popup

### Opção 2: Usar Modo Compatibilidade

```typescript
// Forçar popup com tratamento de bloqueio
if (useMobile) {
  try {
    const result = await signInWithPopup(auth, provider)
    await handleAuthResult(result.user, inviteToken)
  } catch (e) {
    // Fallback para redirect
    await signInWithRedirect(auth, provider)
  }
}
```

### Opção 3: Aumentar Timeout Ainda Mais

```typescript
loginTimeout = setTimeout(() => {...}, 30000) // 30 segundos
```

---

## 📋 Checklist Safari

- [ ] Abrir Web Inspector (Settings → Advanced → Web Inspector)
- [ ] Executar login
- [ ] Observar se aparece tela de seleção do Google
- [ ] Se não aparecer, compartilhar console logs
- [ ] Verificar se getRedirectResult retorna null ou user
- [ ] Ver se browser extension está interferindo

---

## 💡 Debug Avançado

### Ver Todos os Logs Detalhados

```javascript
// No console
fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)

// Esperado:
{
  "mobile": true,
  "session": {"user": null},
  "authCookie": false
}
```

### Testar Redirect Manualmente

```javascript
import { signInWithRedirect } from 'firebase/auth'
import { auth, provider } from '@/lib/firebase'

// Executar manualmente
await signInWithRedirect(auth, provider)
```

### Verificar Domínio

Em Firebase Console:

1. Authentication → Settings
2. Authorized domains
3. Verificar se seu domínio está lá
4. Se não, adicionar:
   - localhost
   - seu-dominio.netlify.app
   - seu-dominio.com

---

## 🎯 Próximos Passos

1. **Teste com fixes implementados**
   - Reload em Safari
   - Observe se agora aparece tela de Google

2. **Se funcionar:** Pronto! ✅

3. **Se não funcionar:**
   - Execute `fetch('/api/debug/auth-flow').then(r => r.json()).then(console.log)`
   - Compartilhe output do console
   - Vou implementar fix específico para Safari

---

## 📞 Se Ficar Preso

Compartilhe:

1. **Console logs** com `[DEBUG]` e `[ERROR]`
2. **Safari version** (Settings → Safari → About Safari)
3. **iOS version** (Settings → General → About)
4. **Resultado de:**
   ```javascript
   navigator.userAgent
   ```

Com essas infos conseguiremos debugar Safari! 🍎
