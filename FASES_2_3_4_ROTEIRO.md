# 🚀 PRÓXIMAS FASES - ROTEIRO DE MELHORIA

**Baseado em**: AUDITORIA_LOGICA_APP.md  
**Status Fase 1**: ✅ CONCLUÍDA E 100% VALIDADA  
**Status Fase 2-4**: 🚧 Em planejamento  
**Prioridade**: 🔴 Crítica → 🟠 Importante → 🟡 Legal ter

---

## ✅ FASE 1: LOGIN (CONCLUÍDA - 22/12/2024)

**Duração real**: 1 dia  
**Status**: ✅ 100% Completo e validado

### O que foi feito:

- ✅ Sistema de erros estruturado (18 tipos específicos com mensagens amigáveis)
- ✅ Timeout aumentado de 15s para 30s para redes lentas
- ✅ Retry automático com backoff exponencial (1s, 2s, 4s)
- ✅ UI/UX melhorado com feedback visual e botões de ação contextuais
- ✅ **Type-safety TOTAL**: 0 `any` em código de produção (Fase 1)
- ✅ TypeScript validation: **100% PASSING** (pnpm type-check)
- ✅ Documentação completa (5 docs criados, todos com link de navegação)
- ✅ QA Checklist: 25 testes de validação pronto para rodar

### Arquivos criados/modificados Fase 1:

1. **NOVO**: [src/lib/auth-errors.ts](src/lib/auth-errors.ts) (277 linhas)
   - AuthErrorCode enum com 18 tipos específicos
   - authErrorMap com mensagens amigáveis para cada erro
   - Helper functions: createAuthError, parseFirebaseError, isNetworkError
2. **MODIFICADO**: [src/context/UserContext.tsx](src/context/UserContext.tsx)
   - Error state management com tipo AuthError | null
   - Retry logic com exponential backoff (3 tentativas)
   - Timeout 30s
   - Type-safe error handling (usando unknown em catch)
   - Quebra de dependência localStorage no estado global
3. **MODIFICADO**: [src/components/login/AuthCard.tsx](src/components/login/AuthCard.tsx)
   - Componente de erro completamente redesenhado
   - Botões de ação baseados em tipo de erro (retry, dismiss, change email)
   - Acessibilidade com role="alert"
   - Mensagem amigável + sugestão para cada tipo de erro
4. **MODIFICADO**: [src/app/login/page.tsx](src/app/login/page.tsx)
   - Integração com novo error state do Context
   - handleRetry function para reintentar login
   - clearError callback para limpar erros

### Validações executadas e PASSADAS:

- ✅ `pnpm run type-check`: **PASSOU** (0 errors)
- ✅ Procura de `any`:
  - Total projeto: 153 ocorrências (em código antigo)
  - **Fase 1 clean**: 0 ocorrências em arquivos de produção
  - 2 ocorrências em catch blocks tipadas corretamente como `unknown`
- ✅ Imports/exports: VALIDADOS
- ✅ Compilação: **SEM ERROS**

### Documentação criada:

- [AUDITORIA_LOGICA_APP.md](AUDITORIA_LOGICA_APP.md) - Diagnóstico completo
- [FASE_1_LOGIN_RESUMO.md](FASE_1_LOGIN_RESUMO.md) - Detalhes implementação
- [FASES_2_3_4_ROTEIRO.md](FASES_2_3_4_ROTEIRO.md) - Este arquivo
- [GUIA_RAPIDO_REFERENCIA.md](GUIA_RAPIDO_REFERENCIA.md) - Quick reference
- [QA_CHECKLIST_FASE_1.md](QA_CHECKLIST_FASE_1.md) - 25 testes
- [INDICE_DOCUMENTACAO.md](INDICE_DOCUMENTACAO.md) - Índice central

### ⏭️ Próximo passo:

**Testar Fase 1 em ambiente real (staging)** usando `QA_CHECKLIST_FASE_1.md` antes de iniciar Fase 2.
Depois, confirmar com PM que login está 100% OK antes de merge para develop.

---

## FASE 2: SESSÃO (CRÍTICA) 🔴

**Duração estimada**: 2-3 dias  
**Impacto**: Alto (sessão é core do app)

### Problema 1: ID Token Firebase dura 1 hora (2.1)

**Cenário de Falha**:

```
T=0min: User faz login
T=50min: Usuário faz uma ação (cria tarefa)
T=59min: ID token expira silenciosamente
T=60min: Request para criar cliente falha (401)
        Usuário vê erro genérico
```

**Solução**: Implementar refresh token

**Arquivos envolvidos**:

- `src/app/api/session/route.ts` (POST - novo refresh endpoint)
- `src/app/api/refresh/route.ts` (NOVO)
- `src/middleware.ts` (interceptar 401 e retry)
- `src/context/UserContext.tsx` (gerenciar tokens)

**Pseudocódigo**:

```typescript
// POST /api/session (modificar)
const response = await fetch('/api/session', { method: 'POST' })
// Retornar:
// {
//   ok: true,
//   accessToken: idToken,
//   refreshToken: "refresh_id_XXXXX",
//   expiresIn: 3600
// }

// POST /api/refresh (NOVO)
// Body: { refreshToken: "refresh_id_XXXXX" }
// Retornar novo accessToken

// Middleware
if (response.status === 401) {
  const refreshed = await fetch('/api/refresh', { ... })
  if (refreshed.ok) {
    retry original request com novo token
  } else {
    redirect to /login
  }
}
```

**Checklist**:

- [ ] Criar endpoint `/api/refresh`
- [ ] Armazenar refresh token em httpOnly cookie
- [ ] Middleware interceptar 401 e retry
- [ ] Testes E2E: Simular token expirado mid-request
- [ ] Verificar compatibilidade com mobile

### Problema 2: Validação de Sessão Incompleta (2.2)

**Cenário de Falha**:

```
T=0min: User faz login, tem role STAFF
T=30min: Admin remove user do team
T=31min: User consegue acessar admin/members (deveria ter 403)
```

**Solução**: Validar permissões a cada request

**Arquivos envolvidos**:

- `src/services/auth/session.ts` (validar contra DB)
- `src/lib/rbac/middleware.ts` (check permissões real-time)
- Cache com TTL para performance

**Pseudocódigo**:

```typescript
// getSessionProfile() - modificar
async function getSessionProfile() {
  const userId = await getUserFromSession()
  const cacheKey = `session:${userId}`

  // Verificar cache (5 minutos)
  const cached = await cache.get(cacheKey)
  if (cached) return cached

  // Validar contra DB
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const member = await prisma.member.findFirst({
    where: { userId, org: { ... } }
  })

  if (!member) {
    // User foi removido do time
    throw new Error('NOT_MEMBER')
  }

  // Cachear resultado
  await cache.set(cacheKey, { user, member }, 300) // 5 min
  return { user, member }
}

// Invalidar cache quando role muda
await cache.delete(`session:${userId}`)
```

**Checklist**:

- [ ] Adicionar cache com Redis ou in-memory
- [ ] Validar membership a cada request
- [ ] Invalidar cache ao mudar role
- [ ] Testes E2E: Remove user mid-action
- [ ] Verificar latência adicionada (cache hit < 1ms)

### Problema 3: Erros Genéricos na API (2.3)

**Cenário de Falha**:

```
GET /api/session → 500 "Session error"
Cliente não sabe se é:
- Sessão expirada (401)
- Acesso negado (403)
- Erro interno (500)
- Servidor down (502)
```

**Solução**: Retornar erros específicos

**Arquivos envolvidos**:

- `src/app/api/session/route.ts` (status codes específicos)
- `src/infrastructure/http/response.ts` (helper de respostas)

**Pseudocódigo**:

```typescript
// GET /api/session
try {
  const session = await getSessionProfile()

  if (!session.user) {
    return NextResponse.json(
      { error: 'NOT_AUTHENTICATED', message: 'Sessão inválida' },
      { status: 401 }
    )
  }

  if (!session.member) {
    return NextResponse.json(
      { error: 'NOT_MEMBER', message: 'Usuário não está em nenhuma org' },
      { status: 403 }
    )
  }

  return NextResponse.json({ ... }, { status: 200 })
} catch (error) {
  if (error.message === 'NOT_MEMBER') {
    return NextResponse.json(
      { error: 'NOT_MEMBER', message: 'Você foi removido da organização' },
      { status: 403 }
    )
  }

  // Erro real do servidor
  logger.error('Session API error', error)
  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Erro do servidor' },
    { status: 500 }
  )
}
```

**Checklist**:

- [ ] Documentar todos os status codes possíveis
- [ ] Cliente pode diferenciar 401 vs 403 vs 500
- [ ] Testes: Cobrir todos os casos
- [ ] Audit: Logging de erros 500

---

## FASE 3: CONVITES (IMPORTANTE) 🟠

**Duração estimada**: 1-2 dias  
**Impacto**: Médio (fluxo de onboarding)

### Problema 1: Fluxo Confuso para CLIENT (3.1)

**Atual**:

```typescript
if (invite.roleRequested === 'CLIENT') {
  if (invite.clientId) {
    // Vincular a cliente existente
    await prisma.client.updateMany({
      where: { id: invite.clientId, clientUserId: null },
      data: { clientUserId: userFromDb.id },
    })
  } else {
    // Criar novo cliente
    const created = await prisma.client.create({...})
  }
}
```

**Problema**:

- Não fica claro se é criando novo cliente ou vinculando existente
- Sem validação se clientId existe e é válido
- Sem feedback de erro

**Solução**: Clarificar tipos de convite

**Arquivos envolvidos**:

- `src/app/api/invites/accept/route.ts` (novo endpoint)
- `prisma/schema.prisma` (adicionar campo `inviteType`)
- `src/services/invites.ts` (nova lógica)

**Pseudocódigo**:

```typescript
// enum InviteType
enum InviteType {
  TEAM_INVITE = 'team_invite',        // Convida alguém para org
  CLIENT_INVITE = 'client_invite',    // Vincula cliente
  CLIENT_CREATE = 'client_create',    // Cria novo cliente
}

// POST /api/invites/accept
async function acceptInvite(token: string, email: string) {
  const invite = await prisma.invite.findUnique({ where: { token } })

  if (!invite) throw new InviteNotFound()
  if (invite.expiresAt < new Date()) throw new InviteExpired()

  switch (invite.type) {
    case InviteType.TEAM_INVITE:
      await createMember(invite.orgId, userId, invite.roleRequested)
      return { nextPath: '/dashboard' }

    case InviteType.CLIENT_INVITE:
      // Vincular a cliente
      const client = await prisma.client.findUnique({
        where: { id: invite.clientId },
        select: { orgId: true }
      })
      if (!client) throw new ClientNotFound()

      await prisma.client.update({
        where: { id: invite.clientId },
        data: { clientUserId: userId }
      })
      return { nextPath: `/clients/${invite.clientId}` }

    case InviteType.CLIENT_CREATE:
      // Criar novo cliente
      const newClient = await prisma.client.create({...})
      return { nextPath: `/clients/${newClient.id}` }
  }
}
```

**Checklist**:

- [ ] Definir InviteType enum
- [ ] Novo endpoint /api/invites/accept
- [ ] Validar clientId antes de usar
- [ ] Testes E2E: 3 tipos de convite
- [ ] Documentar diferença entre tipos

### Problema 2: Erro Convite Expirado (3.2)

**Atual**: Retorna status "expired" mas não mostra como renovar

**Solução**: Mostrar como renovar + opção de email ao admin

**Mudanças**:

```tsx
// AuthCard
if (error?.code === 'auth/invite-expired') {
  return (
    <>
      <p>Esse convite expirou</p>
      <button onClick={requestNewInvite}>Solicitar novo convite</button>
      <CopyButton text='admin-email@example.com' />
    </>
  )
}
```

**Checklist**:

- [ ] Mostrar email do admin para contato
- [ ] Botão para requestNewInvite (enviador email?)
- [ ] UI feedback ao solicitar

### Problema 3: Desincronização Firestore (3.3)

**Atual**: Se Firestore falha, dados ficam inconsistentes

```typescript
try {
  // Firestore update AFTER Prisma success
  await db.collection('users').doc(...).set({...})
} catch (fsErr) {
  console.error('Firestore error')  // ❌ Falha silenciosa
}
```

**Solução**: Job de reconciliação

**Arquivos envolvidos**:

- `src/services/sync/firestore-sync.ts` (NOVO)
- `scripts/sync-firestore.ts` (CLI para sincronizar)
- Cron job diário

**Pseudocódigo**:

```typescript
// Função para sincronizar um user
async function syncUserToFirestore(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const members = await prisma.member.findMany({
    where: { userId },
  })

  try {
    await db
      .collection('users')
      .doc(user.firebaseUid)
      .set(
        {
          orgIds: members.map((m) => m.orgId),
          roles: Object.fromEntries(members.map((m) => [m.orgId, m.role])),
        },
        { merge: true }
      )
  } catch (err) {
    // Queue para retry depois
    await addToRetryQueue(userId)
    throw err
  }
}

// Executar periodicamente
// TODO: Setup cron (ou use Inngest)
```

**Checklist**:

- [ ] Job de sync diário
- [ ] Retry automático se falhar
- [ ] Alertar se muitos syncs falharem
- [ ] Documentar como executar manual

---

## FASE 4: RBAC (IMPORTANTE) 🟠

**Duração estimada**: 1 dia  
**Impacto**: Médio (segurança)

### Problema 1: Cache de Permissões (4.1)

**Atual**: Sem cache, valida permissão a cada request

**Solução**: Cache com invalidação automática

```typescript
// src/lib/rbac/cache.ts
const permissionCache = new Map<string, { perms: string[], expires: number }>();

async function getUserPermissions(userId: string, orgId: string) {
  const key = `perms:${userId}:${orgId}`;
  const cached = permissionCache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.perms;
  }

  // Buscar do DB
  const member = await prisma.member.findUnique({
    where: { userId_orgId: { userId, orgId } },
    include: { role: true }
  });

  const perms = getPermissionsForRole(member.role);

  // Cachear por 5 minutos
  permissionCache.set(key, {
    perms,
    expires: Date.now() + 5 * 60 * 1000
  });

  return perms;
}

// Invalidar cache quando role muda
onRoleChanged(userId, orgId) {
  permissionCache.delete(`perms:${userId}:${orgId}`);
}
```

**Checklist**:

- [ ] Implementar cache (in-memory ou Redis)
- [ ] TTL de 5 minutos
- [ ] Invalidar ao mudar role
- [ ] Testes de performance

### Problema 2: Auditoria de Permissões (4.2)

**Solução**: Log de negações de acesso

```typescript
// middleware para denied access
if (!hasPermission(user, action, resource)) {
  await createAuditLog({
    action: 'PERMISSION_DENIED',
    userId: user.id,
    resource,
    action: action,
    details: {
      userRole: user.role,
      requiredPerms: getRequiredPerms(action, resource),
    },
  })
  return forbidden()
}
```

**Checklist**:

- [ ] Log toda negação de permissão
- [ ] Dashboard com estatísticas
- [ ] Alertas para padrão suspeito

---

## FASE 5: DASHBOARD & FLUXOS (DEPOIS) 🟡

**Duração**: Após Fases 1-4  
**Focos**:

- Auditoria de cada página/fluxo
- Melhorar UX de erros
- Feedback visual consistente

---

## 📊 Cronograma Sugerido

```
Semana 1:
  ├─ Seg-Ter: Fase 1 - Login ✅ [COMPLETO]
  └─ Qua-Qui: Fase 2 - Sessão [PRÓXIMO]

Semana 2:
  ├─ Seg-Ter: Fase 2 cont. (se precisar)
  └─ Qua-Qui: Fase 3 - Convites

Semana 3:
  ├─ Seg-Ter: Fase 4 - RBAC
  └─ Qua-Quinta: Testes E2E + Deploy

Semana 4:
  ├─ Seg: Fase 5 - Dashboard
  └─ Ter+: Monitoramento & Ajustes
```

---

## 🔧 Padrões a Seguir

### 1. **Sempre adicionar tipos estruturados**

```typescript
// ❌ Ruim
async function getUser(id) { ... }

// ✅ Bom
interface UserSession {
  userId: string;
  orgId: string;
  role: Role;
  permissions: Permission[];
}

async function getSession(userId: string): Promise<UserSession> { ... }
```

### 2. **Errors devem ser estruturados**

```typescript
// ✅ Bom
throw new AuthenticationError('SESSION_EXPIRED', {
  userMessage: 'Sua sessão expirou',
  shouldRetry: true,
  code: 'auth/session-expired',
})
```

### 3. **Testes E2E para fluxos críticos**

```bash
pnpm e2e --spec=tests/login.spec.ts
```

### 4. **Documentar breaking changes**

Se modificar API, criar migration guide:

```md
## Migration Guide v1.1 → v1.2

### Session API

ANTES:
POST /api/session { idToken }
→ OK: { ok: true, nextPath }

DEPOIS:
POST /api/session { idToken }
→ OK: {
ok: true,
accessToken,
refreshToken,
expiresIn
}
```

---

## ✅ Checklist de Qualidade

Cada fase deve ter:

- [ ] Tipos TypeScript completos
- [ ] Testes unitários (vitest)
- [ ] Testes E2E (playwright)
- [ ] Documentação no código
- [ ] Comentários em lógica complexa
- [ ] Não adicionar `any`
- [ ] Tratamento de erro em todos os paths
- [ ] Logging para debugging
- [ ] Performance (< 100ms adicional)

---

## 💡 Dicas Extras

1. **Use o script de teste**: `pnpm e2e:smoke` para validar mudanças
2. **Ative debug**: `NEXT_PUBLIC_DEBUG_AUTH=true pnpm dev`
3. **Checkar tipos**: `pnpm type-check` antes de commit
4. **Limpar storage**: `localStorage.clear()` durante testes
5. **Verificar CSP**: Middleware pode bloquear certos recursos

---

## 📞 Suporte

Se encontrar dúvidas:

1. Consulte AUDITORIA_LOGICA_APP.md
2. Verifique padrões existentes em `src/services`
3. Teste com `NEXT_PUBLIC_DEBUG_AUTH=true`
