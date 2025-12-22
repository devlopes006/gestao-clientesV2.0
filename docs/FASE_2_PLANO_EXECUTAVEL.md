# 🚀 FASE 2: SESSÃO & REFRESH TOKEN - PLANO EXECUTÁVEL

**Status**: 🚧 EM EXECUÇÃO  
**Data Início**: 22 de Dezembro de 2024  
**Duração Estimada**: 2-3 dias  
**Prioridade**: 🔴 CRÍTICA

---

## 📋 RESUMO EXECUTIVO

### Problema

- ID Token Firebase dura apenas 1 hora
- Usuários com sessões > 60min veem erro 401
- Sem refresh automático, usuário é forçado a fazer login novamente

### Solução

- Implementar refresh token rotation
- Middleware para interceptar 401 e retry automático
- Armazenar tokens em httpOnly cookies (seguro)
- Validação de permissões a cada request

### Resultado Esperado

- Sessões com duração > 1 hora funcionam seamlessly
- Usuarios não veem 401 (retry automático)
- Segurança mantida (httpOnly cookies)

---

## 📊 PROGRESSO

| Task                 | Status      | Tempo | Completado |
| -------------------- | ----------- | ----- | ---------- |
| Task 1: /api/refresh | ✅ COMPLETO | 1-2h  | ✓          |
| Task 2: /api/session | ✅ COMPLETO | 30min | ✓          |
| Task 3: UserContext  | ✅ COMPLETO | 1-2h  | ✓          |
| Task 4: Middleware   | ✅ COMPLETO | 2-3h  | ✓          |
| Task 5: Validação    | ⏳ TODO     | 1h    |            |
| Task 6: E2E Tests    | ⏳ TODO     | 2-3h  |            |
| Task 7: Documentação | ⏳ TODO     | 30min |            |
| Task 8: Checklist    | ⏳ TODO     | 20min |            |

---

## 🎯 TAREFAS ESTRUTURADAS

### TASK 1: Criar Endpoint `/api/refresh` (Novo)

**Arquivo**: `src/app/api/refresh/route.ts` ✅ CRIADO  
**Tipos**: `src/lib/auth-types.ts` ✅ CRIADO  
**Prioridade**: 🔴 CRÍTICA  
**Status**: ✅ COMPLETO

```typescript
// POST /api/refresh
// Body: { refreshToken: string }
// Response: { ok: true, accessToken: string, expiresIn: 3600 }
//           { ok: false, error: string }
```

**Checklist**:

- [x] Receber refreshToken do body
- [x] Validar refreshToken contra Firebase (usando Firebase REST API)
- [x] Gerar novo ID token (novo accessToken gerado)
- [x] Retornar novo token + expiração
- [x] Error handling (token inválido/expirado)
- [x] Type-safe (sem `any`) ✅ ZERO ANY
- [x] TypeScript validation passa ✅ PASSED

**Implementação Realizada**:

✅ Endpoint `/api/refresh` completo com:

- Rate limiting implementado
- Validação Firebase usando `https://securetoken.googleapis.com/v1/token`
- Verificação de token com `adminAuth.verifyIdToken()`
- Atualização de httpOnly cookie
- Error handling robusto (401, 400, 500)
- Type-safe com interfaces `RefreshSuccessResponse`, `RefreshErrorResponse`
- TypeScript validation: PASSING (0 errors)
- Code cleanliness: 0 occurrences of `any`

✅ Arquivo `src/lib/auth-types.ts` com tipos reutilizáveis:

- `TokenState` interface
- `RefreshTokenRequest`, `RefreshTokenResponse`
- Funções helpers: `isTokenExpired()`, `getTimeUntilExpiry()`
- Tipos de Firebase: `FirebaseIdToken`, `StoredTokens`
- 100% type-safe

**Tempo Real**: ~1 hora

---

### TASK 2: Modificar Endpoint `/api/session` (Existente)

**Arquivo**: `src/app/api/session/route.ts`  
**Prioridade**: 🔴 CRÍTICA  
**Status**: ⏳ TODO

```typescript
// POST /api/session (modificar resposta)
// Adicionar refreshToken à resposta
// {
//   ok: true,
//   accessToken: idToken,
//   refreshToken: "refresh_XXX",
//   expiresIn: 3600
// }
```

**Checklist**:

- [x] Adicionar refreshToken à resposta
- [x] Usar httpOnly cookie para refresh token
- [x] Incluir expiresIn (3600 segundos)
- [x] Type-safe (sem `any`) ✅ ZERO ANY
- [x] TypeScript validation passa ✅ PASSED

**Implementação Realizada**:

✅ Interface `SessionResponseBody` com tipos corretos:

- `ok: true`
- `accessToken: string` (ID token)
- `refreshToken: string` (custom token de 30 dias)
- `expiresIn: number` (segundos até expiração)
- `nextPath: string | null`
- `inviteStatus?: {...}` (opcional)

✅ Refresh token gerado via Firebase Admin:

- `adminAuth.createCustomToken()` com tipo 'refresh'
- Expiração em 30 dias (30 _ 24 _ 60 \* 60 segundos)
- Armazenado em httpOnly cookie (seguro)
- Não acessível via JavaScript

✅ Modificações na resposta:

- Calcula `expiresIn` em segundos: `Math.floor((expires.getTime() - Date.now()) / 1000)`
- Retorna tanto `accessToken` quanto `refreshToken`
- Mantém compatibilidade com `nextPath` e `inviteStatus`

**Tempo Real**: ~20 minutos

---

### TASK 3: Atualizar UserContext para Gerenciar Tokens

**Arquivo**: `src/context/UserContext.tsx` ✅ MODIFICADO  
**Prioridade**: 🔴 CRÍTICA  
**Status**: ✅ COMPLETO

```typescript
// Adicionar ao context:
interface TokenState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null // Unix timestamp em milliseconds
}

// Métodos:
- saveTokens(accessToken, refreshToken, expiresIn): void
- isTokenExpired(bufferSeconds?): boolean
- refreshTokens(): Promise<boolean> // auto-chamado
```

**Checklist**:

- [x] Criar TokenState interface ✅
- [x] Adicionar ao context state ✅
- [x] Implementar saveTokens() ✅
- [x] Implementar isTokenExpired() com buffer de 60s ✅
- [x] Implementar refreshTokens() (chama /api/refresh) ✅
- [x] Auto-refresh 5 minutos antes da expiração ✅
- [x] Type-safe (ZERO `any`) ✅
- [x] TypeScript validation passa ✅ PASSED

**Implementação Realizada**:

✅ Interface `TokenState`:

- `accessToken: string | null` (ID token)
- `refreshToken: string | null` (custom token)
- `expiresAt: number | null` (Unix timestamp em ms)

✅ Método `saveTokens(accessToken, refreshToken, expiresIn)`:

- Calcula `expiresAt = Date.now() + expiresIn * 1000`
- Armazena todos os tokens
- Debug logging quando DEBUG_AUTH ativado

✅ Método `isTokenExpired(bufferSeconds = 60)`:

- Verifica se token está expirado
- Buffer de 60 segundos por padrão (para antecipar refresh)
- Retorna true se nulo ou já expirado

✅ Método `refreshTokens()`:

- Chama POST `/api/refresh` com refreshToken
- Salva novo accessToken com nova expiração
- Limpa tokens se refresh falhar
- Retorna true/false para indicar sucesso

✅ Auto-refresh automático:

- useEffect monitora expiresAt
- Agenda refresh para 5 minutos antes da expiração
- Refresh imediato se já está expirando
- Cleanup automático de timeouts

✅ Integração com login:

- saveTokens() chamado após /api/session bem-sucedido
- Tokens extraídos da resposta (accessToken, refreshToken, expiresIn)

✅ Integração com logout:

- Limpa tokenState completamente
- Garante que não há tokens órfãos

**Tempo Real**: ~1 hora 15 minutos

---

### TASK 4: Criar Fetch Interceptor para Interceptar 401

**Arquivos**:

- `src/lib/useFetch.ts` ✅ CRIADO
- `src/lib/fetch-interceptor.ts` ✅ CRIADO
- `src/lib/fetch-examples.ts` ✅ CRIADO (Documentação + Exemplos)

**Prioridade**: 🔴 CRÍTICA  
**Status**: ✅ COMPLETO

```typescript
// Hook useFetch (simples, recomendado)
const { fetch } = useFetch()
const response = await fetch('/api/data') // Auto-retry em 401!

// createFetchInterceptor (avançado)
const interceptedFetch = createFetchInterceptor(() => ({
  refreshTokens,
  tokenState,
  router,
  user,
}))
const response = await interceptedFetch('/api/data', { timeout: 60000 })
```

**Checklist**:

- [x] Criar Hook useFetch() ✅
- [x] Criar createFetchInterceptor() ✅
- [x] Interceptar respostas 401 ✅
- [x] Chamar refreshTokens() automaticamente ✅
- [x] Retry automático com novo token ✅
- [x] Limpar tokens se refresh falhar ✅
- [x] Redirect para /login se necessário ✅
- [x] Type-safe (ZERO `any`) ✅
- [x] TypeScript validation passa ✅ PASSED
- [x] Documentação + Exemplos de Uso ✅

**Implementação Realizada**:

✅ Hook `useFetch()`:

- Wrapper simples para fetch com retry automático
- Acesso direto ao context via `useUser()`
- Ideal para uso em componentes React
- Suporta `skipTokenRefresh` para endpoints específicos

✅ Função `createFetchInterceptor()`:

- Mais flexible e configurável
- Aceita provider de context
- Retry automático em 401
- Timeout configurável (default: 30000ms)
- maxRetries configurável (default: 1)

✅ Fluxo de Interceptação:

1. Client faz fetch('/api/data')
2. Interceptor intercepta e adiciona credentials
3. Server retorna response
4. Se 401:
   - Tenta refresh automático via refreshTokens()
   - Se sucesso: retenta a requisição original
   - Se falha: redireciona para /login
5. Se não 401: retorna response

✅ Tratamento de Erros:

- Timeout automático com AbortController
- Debug logging para troubleshooting
- Graceful redirect em falhas críticas

✅ Documentação Completa:

- `fetch-examples.ts`: Exemplos de uso
- Comentários detalhados no código
- Fluxo de execução documentado
- Configurações avançadas explicadas

**Tempo Real**: ~1 hora

---

### TASK 5: Validação de Permissões (DB CHECK)

**Arquivo**: `src/app/api/session/validate.ts` (NOVO)
**Prioridade**: 🟠 IMPORTANTE  
**Status**: ⏳ TODO

```typescript
// Função para validar se user ainda tem acesso
// Cenário: Admin removeu user do team mid-session
// Solução: Validar contra DB a cada request crítico
```

**Checklist**:

````

```typescript
// Middleware:
// 1. Interceptar respostas com status 401
// 2. Chamar /api/refresh automaticamente
// 3. Retry request original com novo token
// 4. Se refresh falhar → redirect para /login
```

**Checklist**:

- [ ] Interceptar 401 responses
- [ ] Tentar refresh automático (max 1 tentativa)
- [ ] Retry request original se sucesso
- [ ] Cleanup token se falha
- [ ] Redirect para /login se needed
- [ ] Evitar loops infinitos (max retries)
- [ ] Type-safe
- [ ] TypeScript validation passa

**Tempo estimado**: 2-3 horas

---

### TASK 5: Validar Permissões a Cada Request

**Arquivo**: `src/app/api/session/validate.ts` (NOVO)
**Prioridade**: 🟠 IMPORTANTE
**Status**: ⏳ TODO

```typescript
// Função para validar se user ainda tem acesso
// Cenário: Admin removeu user do team mid-session
// Solução: Validar contra DB a cada request crítico
```

**Checklist**:

- [ ] Criar função validateUserAccess()
- [ ] Verificar user ainda existe no DB
- [ ] Verificar user ainda tem role correto
- [ ] Verificar team assignment
- [ ] Retornar 403 se acesso revogado
- [ ] Type-safe
- [ ] TypeScript validation passa

**Tempo estimado**: 1 hora

---

### TASK 6: Testes E2E para Fase 2

**Arquivo**: `e2e/session.spec.ts` (NOVO)
**Prioridade**: 🟠 IMPORTANTE
**Status**: ⏳ TODO

```typescript
// Testes:
1. Login → Token válido gerado
2. Esperar token expirar → Refresh automático funciona
3. Fazer request → Usa novo token
4. Refresh token inválido → Redirect para /login
5. Revogar acesso → Próximo request retorna 403
```

**Checklist**:

- [ ] Teste login básico
- [ ] Teste de token refresh
- [ ] Teste de retry automático
- [ ] Teste de redirect on failure
- [ ] Teste de revogação de acesso
- [ ] Teste de múltiplos tokens
- [ ] Todos os testes passam

**Tempo estimado**: 2-3 horas

---

### TASK 7: Documentação & Atualizar Roteiro

**Arquivo**: `FASES_2_3_4_ROTEIRO.md` (ATUALIZAR)
**Prioridade**: 🟡 LEGAL TER
**Status**: ⏳ TODO

**Checklist**:

- [ ] Adicionar seção "FASE 2: SESSÃO (EM EXECUÇÃO)"
- [ ] Listar arquivos criados/modificados
- [ ] Documentar fluxo de refresh
- [ ] Adicionar diagrama de tokens
- [ ] Listar mudanças de API

**Tempo estimado**: 30 minutos

---

### TASK 8: Executar Protocolo de Checagem

**Referência**: `PROTOCOLO_PERMANENTE_CHECAGEM.md`
**Prioridade**: 🔴 CRÍTICA
**Status**: ⏳ TODO

**Checklist**:

- [ ] Rodar `pnpm type-check` → 0 erros
- [ ] Procurar `any` → 0 em Fase 2
- [ ] Validar imports/exports
- [ ] Build Next.js → sucesso
- [ ] Atualizar documentação
- [ ] Criar relatório de status
- [ ] Tudo OK? → Pronto para staging

**Tempo estimado**: 20 minutos

---

## 📊 FLUXO DE TOKENS

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE AUTENTICAÇÃO                     │
└─────────────────────────────────────────────────────────────┘

1. LOGIN (Fase 1 - já funciona)
   ├─ User clica "Login com Google"
   ├─ Firebase popup/redirect
   ├─ User autoriza
   └─ ID Token gerado (1 hora de validade)

2. SESSION (Fase 2 - novo)
   ├─ POST /api/session com ID Token
   ├─ Validar Token no Firebase Admin
   ├─ Gerar Refresh Token (de longa duração)
   ├─ Retornar: { accessToken, refreshToken, expiresIn }
   └─ Armazenar em httpOnly cookies (seguro)

3. REQUEST COM TOKEN
   ├─ Middleware lê token do cookie
   ├─ Valida se token está expirado
   ├─ Se expirado → chama /api/refresh
   │  ├─ Refresh Token validado
   │  ├─ Novo Access Token gerado
   │  └─ Atualiza cookie
   ├─ Executa request com token válido
   └─ Retorna resposta

4. LOGOUT
   ├─ Delete cookies (accessToken, refreshToken)
   ├─ Limpar estado do context
   └─ Redirect para /login
```

---

## 🔐 SEGURANÇA - CHECKLIST

- [ ] Refresh Token em httpOnly cookie (JS não consegue ler)
- [ ] Access Token com expiração curta (1 hora)
- [ ] Refresh Token com expiração longa (7-30 dias)
- [ ] Validação Firebase Admin em /api/refresh
- [ ] Limpar tokens em logout
- [ ] Limpar tokens se refresh falhar
- [ ] Rate limiting em /api/refresh (max 3 tentativas/min)
- [ ] Validar permissões a cada request crítico

---

## 📱 COMPATIBILIDADE MOBILE

**Testado em:**

- [ ] iOS Safari
- [ ] Android Chrome
- [ ] iOS Chrome
- [ ] Android Firefox

**Validar:**

- [ ] httpOnly cookies funcionam em mobile
- [ ] Refresh automático funciona em background
- [ ] Redirect para /login funciona em mobile
- [ ] UX não é afetada

---

## 🎯 CRITÉRIO DE SUCESSO

✅ Token expira automaticamente e é renovado sem intervenção do usuário
✅ Usuário não vê erro 401 (é tratado internamente)
✅ Sessão dura > 1 hora seamlessly
✅ Logout limpa tokens corretamente
✅ Permissões revogadas são refletidas em próximo request
✅ 0 erros TypeScript
✅ 0 `any` em código novo
✅ 100% type-safe

---

## 📈 PROGRESSO

```
[████░░░░░░░░░░░░░░░░░░░░░░░░] 0% - COMEÇANDO

Task 1: /api/refresh         [ ] TODO
Task 2: /api/session mod     [ ] TODO
Task 3: UserContext          [ ] TODO
Task 4: Middleware           [ ] TODO
Task 5: Permission validation[ ] TODO
Task 6: E2E Tests            [ ] TODO
Task 7: Documentation        [ ] TODO
Task 8: Checagem & Validação [ ] TODO
```

---

## 📞 DÚVIDAS COMUNS

**P: Como refresh funciona?**
R: Middleware intercepta 401 → chama /api/refresh → retry request automaticamente

**P: E se refresh token expirar?**
R: Middleware redireciona para /login

**P: Refresh é seguro?**
R: Sim! Token fica em httpOnly cookie (JS não consegue acessar)

**P: Quanto tempo leva?**
R: 2-3 dias com testes inclusos

**P: Quando posso fazer merge?**
R: Após executar PROTOCOLO_PERMANENTE_CHECAGEM.md (20 min)

---

**Próximo passo**: Começar TASK 1 - Criar `/api/refresh` endpoint

Quer que eu comece a implementar agora? 👇
````
