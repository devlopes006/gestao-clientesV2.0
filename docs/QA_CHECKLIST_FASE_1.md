# ✅ CHECKLIST DE QA - FASE 1 LOGIN

**Responsável**: QA/Dev  
**Data**: 22 de Dezembro, 2024  
**Status**: Pronto para testes

---

## 📋 Pré-Requisitos

- [ ] Node.js 20+ instalado
- [ ] `pnpm install` executado
- [ ] Firebase SDK configurado
- [ ] `.env.local` com credenciais corretas
- [ ] `pnpm dev` rodando em http://localhost:3000
- [ ] DevTools aberto (F12)

---

## 🧪 Testes Funcionais

### 1. Login Bem-Sucedido

**Cenário**: Usuario faz login com google

```
Passos:
1. Acesse http://localhost:3000/login
2. Clique "Continuar com Google"
3. Selecione conta Google
4. Aguarde redirect
```

**Resultado esperado**:

- [ ] Popup Google aparece
- [ ] Login bem-sucedido
- [ ] Redirect para dashboard
- [ ] Usuário logado no app
- [ ] Console: "[DEBUG] UserContext: sessão OK"

**Resultado real**: ****\_\_\_****

---

### 2. Timeout de Login (30 segundos)

**Cenário**: Simular rede lenta

```
Passos:
1. DevTools → Network
2. Mudar para "Slow 4G"
3. http://localhost:3000/login
4. Clique "Continuar com Google"
5. Aguarde 30+ segundos
```

**Resultado esperado**:

- [ ] Spinner aparece por ~30s
- [ ] Mensagem: "O login excedeu o tempo limite. Tente novamente."
- [ ] Botão "Tentar novamente" aparece
- [ ] Botão "Descartar" aparece
- [ ] Console: "[ERROR] [UserContext] Timeout no login após redirect"

**Resultado real**: ****\_\_\_****

---

### 3. Retry Automático (500 Error)

**Cenário**: API retorna erro 500

```
Passos:
1. No browser console, monkey-patch fetch:
   window.origFetch = fetch;
   window.fetch = async (...args) => {
     if (args[0].includes('/api/session')) {
       return { ok: false, status: 500 };
     }
     return window.origFetch(...args);
   }
2. Clique "Continuar com Google"
3. Aguarde (deve tentar 3x)
```

**Resultado esperado**:

- [ ] Faz request para /api/session
- [ ] Retorna 500
- [ ] Aguarda ~1s e tenta novamente
- [ ] Aguarda ~2s e tenta novamente
- [ ] Aguarda ~4s e tenta novamente
- [ ] Após 3 falhas, exibe erro
- [ ] Console: "retry 1/3 após 1000ms"

**Resultado real**: ****\_\_\_****

---

### 4. Popup Bloqueado

**Cenário**: Navegador tem popup bloqueado

```
Passos:
1. Settings → Privacy → Block pop-ups (ON)
2. http://localhost:3000/login
3. Clique "Continuar com Google"
```

**Resultado esperado**:

- [ ] Popup é bloqueado
- [ ] App detecta bloqueio
- [ ] Usa redirect como fallback
- [ ] Mensagem: "Desbloqueie popups neste site e tente novamente"
- [ ] Sugestão: "Clique no ícone de bloqueio..."
- [ ] Botão "Tentar novamente"
- [ ] Console: "popup bloqueado, usando redirect como fallback"

**Resultado real**: ****\_\_\_****

---

### 5. Convite com Email Mismatch

**Cenário**: Convite para email diferente

```
Passos:
1. Criar convite para: john@example.com
2. Acessar: /login?invite=TOKEN
3. Fazer login com: jane@example.com
```

**Resultado esperado**:

- [ ] Login processa
- [ ] Backend detecta mismatch
- [ ] Mensagem: "O email da sua conta Google não bate com o email do convite"
- [ ] Sugestão: "Faça login com a conta Google correta..."
- [ ] Botão "Usar outro e-mail" aparece
- [ ] Botão "Tentar novamente"

**Resultado real**: ****\_\_\_****

---

### 6. Convite Expirado

**Cenário**: Convite expirou

```
Passos:
1. Criar convite com expiração = ontem
2. Acessar: /login?invite=TOKEN
3. Fazer login
```

**Resultado esperado**:

- [ ] Mensagem: "Esse convite expirou"
- [ ] Sugestão: "Solicite um novo convite ao administrador"
- [ ] Botão "Descartar"
- [ ] SEM botão "Tentar novamente" (isRetryable = false)

**Resultado real**: ****\_\_\_****

---

### 7. Botão Tentar Novamente Funciona

**Cenário**: Usuário clica retry após erro

```
Passos:
1. Forçar erro de network (Slow 4G)
2. Clique "Continuar com Google"
3. Aguarde timeout
4. Clique "Tentar novamente"
```

**Resultado esperado**:

- [ ] Botão desabilitado durante retry
- [ ] Spinner aparece
- [ ] Tenta login novamente
- [ ] Se sucessar, redirect
- [ ] Se falhar, exibe erro novamente

**Resultado real**: ****\_\_\_****

---

### 8. Botão Descartar Funciona

**Cenário**: Usuário descarta erro

```
Passos:
1. Forçar erro de popup bloqueado
2. Clique "Descartar"
```

**Resultado esperado**:

- [ ] Erro desaparece
- [ ] Mensagem limpa
- [ ] Usuário pode clicar "Continuar com Google" novamente
- [ ] Estado limpo: error = null

**Resultado real**: ****\_\_\_****

---

### 9. Mobile Login (Android)

**Cenário**: Login em dispositivo mobile

```
Passos:
1. Habilitar debug: NEXT_PUBLIC_DEBUG_AUTH=true pnpm dev
2. Mobile em mesma rede Wi-Fi
3. Acessar: http://SEU_IP_LOCAL:3000/login
4. Clique "Continuar com Google"
5. Selecionar Google Account
6. Aguardar redirect
```

**Resultado esperado**:

- [ ] Mobile detection funciona
- [ ] Usa redirect (não popup)
- [ ] Google login funciona
- [ ] Redirect volta para app
- [ ] Login bem-sucedido no mobile
- [ ] Console mobile mostra logs DEBUG

**Resultado real**: ****\_\_\_****

---

### 10. Mobile Login (iOS/Safari)

**Cenário**: Login em iPhone/Safari

```
Passos:
1. iPhone na mesma rede
2. Safari: http://SEU_IP:3000/login
3. Clique "Continuar com Google"
4. Faça login no Google
5. Aguardar volta para app
```

**Resultado esperado**:

- [ ] Login funciona no Safari
- [ ] Timeout especial para Safari (2s extra)
- [ ] Redirect processa corretamente
- [ ] Não fica travado em "Carregando..."

**Resultado real**: ****\_\_\_****

---

## 🔍 Testes de Integração

### 11. Integração com SessionAPI

**Cenário**: Verificar se /api/session recebe token

```
Passos:
1. Adicione log em src/app/api/session/route.ts:
   console.log('POST /api/session', { idToken: idToken.substring(0, 20) })
2. Faça login
3. Verificar console do servidor
```

**Resultado esperado**:

- [ ] Servidor recebe POST /api/session
- [ ] idToken é recebido
- [ ] Session cookie é criado (auth httpOnly)
- [ ] Resposta: { ok: true, nextPath, ... }

**Resultado real**: ****\_\_\_****

---

### 12. Integração com UserProfile

**Cenário**: Verificar se /api/profile funciona

```
Passos:
1. Após login bem-sucedido
2. Console: fetch('/api/profile').then(r => r.json()).then(console.log)
```

**Resultado esperado**:

- [ ] GET /api/profile retorna usuário
- [ ] User data bate com Firebase
- [ ] Profile image é carregado (se existir)

**Resultado real**: ****\_\_\_****

---

## 🎨 Testes de UI

### 13. Erro Box Visual

**Cenário**: Verificar visual do erro

```
Passos:
1. Forçar timeout
2. Verificar visual da caixa de erro
```

**Resultado esperado**:

- [ ] Background vermelho claro
- [ ] Ícone AlertCircle em vermelho
- [ ] Texto em branco/claro
- [ ] Sugestão em cinza claro
- [ ] Botões com bom contraste
- [ ] Responsivo em mobile (não quebra layout)

**Resultado real**: ****\_\_\_****

---

### 14. Botões Acessíveis

**Cenário**: Testar acessibilidade

```
Passos:
1. Tab pelo formulário
2. Verificar foco em botões
3. Testar com keyboard
```

**Resultado esperado**:

- [ ] Botões recebem foco visual
- [ ] Enter ativa botão
- [ ] aria-label corretos
- [ ] Cores com suficiente contraste (WCAG AA)

**Resultado real**: ****\_\_\_****

---

## 📱 Testes de Performance

### 15. Tempo de Carregamento

**Cenário**: Login rápido

```
Passos:
1. Network: No throttling
2. Medir tempo de login até redirect
3. DevTools → Lighthouse → Measure
```

**Resultado esperado**:

- [ ] Login bem-sucedido < 5 segundos
- [ ] Sem lag visível
- [ ] Spinner suave (60fps)

**Resultado real**: ****\_\_\_****

---

### 16. Bundle Size

**Cenário**: Verificar se bundle aumentou muito

```
Passos:
pnpm build
du -sh .next
```

**Resultado esperado**:

- [ ] .next/ não aumentou > 5%
- [ ] Não há duplicate imports

**Resultado real**: ****\_\_\_****

---

## 🔐 Testes de Segurança

### 17. Token Não Exposto

**Cenário**: Verificar se token é seguro

```
Passos:
1. Faça login
2. DevTools → Application → Cookies
3. Procure por "auth"
4. Verificar se é httpOnly
```

**Resultado esperado**:

- [ ] Cookie "auth" é httpOnly (não acessível via JS)
- [ ] Cookie é Secure (HTTPS only em prod)
- [ ] Cookie é SameSite=lax
- [ ] Token NÃO está em localStorage

**Resultado real**: ****\_\_\_****

---

### 18. CSP Headers

**Cenário**: Verificar Content Security Policy

```
Passos:
1. DevTools → Network
2. Clique em /login
3. Response Headers → Content-Security-Policy
```

**Resultado esperado**:

- [ ] CSP header está presente
- [ ] Firebase auth está no script-src
- [ ] Google fonts permitido
- [ ] Não há \*; (wildcard não seguro)

**Resultado real**: ****\_\_\_****

---

## 📊 Testes de Compatibilidade

### 19. Navegadores Modernos

Testar em:

- [ ] Chrome 90+ (Windows/Mac/Linux)
- [ ] Firefox 88+ (Windows/Mac/Linux)
- [ ] Safari 14+ (Mac/iOS)
- [ ] Edge 90+ (Windows)

**Resultado esperado**: Login funciona em todos

---

### 20. Mobile Browsers

Testar em:

- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile (Android)

**Resultado esperado**: Login funciona em todos

---

## 🐛 Testes de Erro

### 21. Erro 401 (Not Authenticated)

**Cenário**: Session API retorna 401

```
Passos:
1. Monkey-patch /api/session para retornar 401
2. Tente fazer login
```

**Resultado esperado**:

- [ ] Mensagem: "Sua sessão é inválida. Por favor, tente fazer login novamente."
- [ ] Botão "Tentar novamente"
- [ ] Não fica em loop infinito

**Resultado real**: ****\_\_\_****

---

### 22. Erro 403 (Forbidden)

**Cenário**: User não tem acesso

```
Passos:
1. Monkey-patch para retornar 403
2. Tente fazer login
```

**Resultado esperado**:

- [ ] Mensagem específica de acesso negado
- [ ] Sugestão para contatar admin
- [ ] Sem botão retry (não ajuda)

**Resultado real**: ****\_\_\_****

---

### 23. Network Error

**Cenário**: Sem conexão de internet

```
Passos:
1. Desligar Wi-Fi
2. Clique "Continuar com Google"
```

**Resultado esperado**:

- [ ] Mensagem: "Verifique sua conexão de internet"
- [ ] Sugestão: "Clique novamente para tentar"
- [ ] Botão "Tentar novamente"
- [ ] Reconecte e clique retry → funciona

**Resultado real**: ****\_\_\_****

---

## 📝 Testes de Logging

### 24. Debug Logging

**Cenário**: Verificar logs detalhados

```
Passos:
1. NEXT_PUBLIC_DEBUG_AUTH=true pnpm dev
2. Faça login
3. Verifique console
```

**Resultado esperado**:

- [ ] [DEBUG] UserContext: login iniciado
- [ ] [DEBUG] UserContext: tentando signInWithPopup
- [ ] [DEBUG] UserContext: popup funcionou
- [ ] [DEBUG] UserContext: setUser
- [ ] [DEBUG] UserContext: sessão OK
- [ ] [DEBUG] UserContext: redirect

**Resultado real**: ****\_\_\_****

---

### 25. Error Logging

**Cenário**: Verificar logs de erro

```
Passos:
1. Forçar erro (timeout)
2. Verifique console
```

**Resultado esperado**:

- [ ] [ERROR] [UserContext] Erro no login Google
- [ ] Stack trace completo
- [ ] Código de erro Firebase

**Resultado real**: ****\_\_\_****

---

## 📋 Sign-Off

### Dev

- [ ] Testei localmente
- [ ] Rodei testes (`pnpm test`, `pnpm e2e:smoke`)
- [ ] Type check passou (`pnpm type-check`)
- [ ] Sem warnings no console
- Data: ****\_****

### QA

- [ ] Executei todos os testes acima
- [ ] Documentei resultados
- [ ] Aprovado para deploy
- Data: ****\_****

### PM (Opcional)

- [ ] Revisou e aprovou
- [ ] Pronto para deploy em produção
- Data: ****\_****

---

## 🎯 Resultado Final

| Teste | Status | Notas       |
| ----- | ------ | ----------- |
| 1-25  | ✅/❌  | Listar aqui |

**Total de Testes**: 25  
**Passou**: **/25  
**Falhou**: **/25

---

## 🚀 Próximas Ações

Se todos testes passarem:

1. [ ] Criar PR com mudanças
2. [ ] Request review
3. [ ] Merge para develop
4. [ ] Deploy em staging
5. [ ] Validar em staging (2-3 dias)
6. [ ] Deploy em produção

Se testes falharem:

1. [ ] Documentar falhas acima
2. [ ] Criar issues no GitHub
3. [ ] Prioritizar por severidade
4. [ ] Recontestar após fix

---

**Checklist versão**: 1.0  
**Última atualização**: 22 de Dezembro de 2024
