# 🔍 AUDITORIA GERAL DA LÓGICA DA APLICAÇÃO

**Data**: 22 de Dezembro, 2024  
**Status**: Em Progresso  
**Prioridade**: Alta

---

## 📋 ÍNDICE RÁPIDO

1. [Login & Autenticação](#1-login--autenticação)
2. [Sessão & Cookies](#2-sessão--cookies)
3. [Sistema de Convites](#3-sistema-de-convites)
4. [RBAC & Permissões](#4-rbac--permissões)
5. [Dashboard & Fluxos](#5-dashboard--fluxos)
6. [Plano de Ação](#plano-de-ação)

---

## 1. LOGIN & AUTENTICAÇÃO

### ✅ O que funciona bem

- **Firebase Auth integrado**: Google OAuth via Firebase está funcionando
- **Debug mode**: Sistema de `NEXT_PUBLIC_DEBUG_AUTH` permite diagnóstico
- **Estratégia popup + redirect**: Lida bem com bloqueadores de popup e mobile
- **Mobile detection**: Detecta dispositivos mobile automaticamente

### ⚠️ Problemas encontrados

#### 1.1 Tratamento de Erros Vago

```tsx
// Atual: genérico demais
setError(err?.message || 'Erro ao autenticar')

// Problema: usuário não sabe o que fazer
```

**Impacto**: Usuários confusos em caso de falha  
**Severidade**: 🟡 Média

#### 1.2 Timeout Firebase Muito Curto

```tsx
// src/context/UserContext.tsx linha ~187
loginTimeout = setTimeout(() => {
  setLoading(false)
}, 15000) // 15 segundos
```

**Problema**: Em conexões lentas ou Safari, pode dar timeout antes de Firebase processar  
**Severidade**: 🔴 Alta (especialmente mobile)

#### 1.3 Falta de Recuperação de Erro

- Se `handleAuthResult` falha, usuário fica com spinner infinito
- Sem retry automático
- Sem opção manual de retry

**Severidade**: 🔴 Alta

#### 1.4 Armazenamento de Dados Frágil

```tsx
sessionStorage.setItem('pendingInviteToken', inviteToken)
localStorage.setItem('pendingAuthRedirect', 'true')
```

**Problema**:

- Storage diferente para dados relacionados
- Sem limpeza garantida em erro
- Risco de dados órfãos

**Severidade**: 🟡 Média

### 📊 Fluxo Atual (com pontos críticos)

```
[Login Page]
    ↓
    → loginWithGoogle()
    ↓
    → Estratégia: popup OU redirect
    ↓ ❌ PROBLEMA: Se popup falhar silenciosamente
    ↓
    → Firebase auth popup/redirect
    ↓ (Risco de timeout aqui)
    ↓
    → handleAuthResult()
    ↓ (Risco de falha sem retry)
    ↓ ❌ PROBLEMA: Sem tratamento de erro
    ↓
    → POST /api/session (idToken)
    ↓
    → Set auth cookie + criar user
    ↓
    → Redirect para dashboard/org
```

---

## 2. SESSÃO & COOKIES

### ✅ O que funciona bem

- **Session API**: GET retorna usuário atual, POST cria sessão
- **Rate limiting**: Implementado em `/api/session`
- **Token verification**: Firebase admin verifica ID token corretamente
- **HttpOnly cookie**: Protegido contra XSS

### ⚠️ Problemas encontrados

#### 2.1 Falta de Refresh Token

```typescript
// POST /api/session
const expires = new Date(decoded.exp * 1000)
// Usa exp do ID token Firebase (~1 hora)
```

**Problema**: ID token Firebase dura apenas ~1 hora

- Usuário pode perder sessão no meio de uma ação
- Sem mecanismo de refresh automático

**Severidade**: 🟡 Média

#### 2.2 Validação de Sessão Incompleta

```typescript
// GET /api/session - só retorna dados sem validar contexto
const { user, orgId, role } = await getSessionProfile()
```

**Problema**: Não valida se usuário ainda deve ter acesso (ex: foi removido da org)  
**Severidade**: 🟡 Média

#### 2.3 Erro 500 Genérico

```typescript
} catch (err) {
  console.error('[Session API] GET error', err)
  return NextResponse.json({ error: 'Session error' }, { status: 500 })
}
```

**Problema**: Cliente não diferencia entre sessão inválida e erro do servidor  
**Severidade**: 🟡 Média

---

## 3. SISTEMA DE CONVITES

### ✅ O que funciona bem

- **Fluxo atômico**: Convite, user onboarding e member creation em transaction
- **Validação de email**: Verifica se email do usuário bate com invite
- **Expiração de convite**: Valida `expiresAt`
- **Role mapping**: Cria member com role correto (OWNER, STAFF, CLIENT)

### ⚠️ Problemas encontrados

#### 3.1 Fluxo Confuso para Cliente (CLIENT role)

```typescript
if (invite.roleRequested === 'CLIENT') {
  if (invite.clientId) {
    // Usa invite.clientId
    await prisma.client.updateMany({
      where: { id: invite.clientId, clientUserId: null },
      data: { clientUserId: userFromDb.id },
    })
  } else {
    // Cria cliente novo
    const created = await prisma.client.create({...})
  }
}
```

**Problema**:

- Não fica claro se convite é para vinc cliente à organização OU criar novo cliente
- Sem validação se ClientId existe/é válido
- Sem feedback se operação falha

**Severidade**: 🔴 Alta

#### 3.2 Sem Tratamento de Invite Expirado

```typescript
if (invite.expiresAt <= new Date())
  inviteStatus = { status: 'expired', email: invite.email }
```

**Problema**: Retorna status mas não mostra ao usuário como renovar  
**Severidade**: 🟡 Média

#### 3.3 Desincronização Firestore

```typescript
try {
  // Atualiza Firestore após sucesso Prisma
  const db = getFirestore()
  await userRef.set({...}, { merge: true })
  await orgRef.set({...}, { merge: true })
} catch (fsErr) {
  console.error('[Session API] Firestore update error', fsErr)
  // ❌ Falha silenciosa! Dados inconsistentes
}
```

**Problema**: Se Firestore falhar, dados ficam inconsistentes entre Prisma e Firebase  
**Severidade**: 🔴 Alta (data consistency issue)

---

## 4. RBAC & PERMISSÕES

### ✅ O que funciona bem

- **Estrutura clara**: `rules` objeto define perms por role
- **Funções helper**: `can()`, `canDo()` para verificar perms
- **Roles bem definidos**: OWNER, STAFF, CLIENT

### ⚠️ Problemas encontrados

#### 4.1 Permissões Não Sincronizam com Realtime

```typescript
// src/lib/permissions.ts (isomorphic)
// Usa dados estáticos da request, não valida contra DB
```

**Problema**:

- Se role do usuário mudar, aplicação não percebe até reload
- Sem invalidação de cache de permissões

**Severidade**: 🟡 Média

#### 4.2 Sem Auditoria de Negação

```typescript
// Não há log quando alguém tenta acessar algo sem permissão
return ApiResponseHandler.forbidden('Acesso negado')
```

**Problema**: Impossível rastrear tentativas de acesso não autorizado  
**Severidade**: 🟡 Média (compliance)

---

## 5. DASHBOARD & FLUXOS

### Estrutura do projeto

```
src/app/(app)/
  ├── admin/
  │   ├── members/       ❓ Gerenciar membros
  │   └── page.tsx
  ├── (dashboard)/
  │   └── (APP)
  └── ...
```

### 📌 Precisa investigar

- [ ] Layout do dashboard `/dashboard`
- [ ] Fluxo de criação de clientes
- [ ] Fluxo de tarefas
- [ ] Fluxo de reuniões
- [ ] Fluxo de financeiro

---

## 🎯 PLANO DE AÇÃO

### Fase 1: Login (CRÍTICO) 🔴

**Objetivo**: Tornar login robusto e user-friendly

- [ ] **1.1**: Melhorar mensagens de erro com orientação
  - Codes de erro específicos (auth/network, auth/popup-blocked, etc)
  - Sugestões de ação para cada erro
- [ ] **1.2**: Aumentar timeout e adicionar retry
  - Aumentar timeout para 30s
  - Botão de retry manual se falhar
  - Exponential backoff para retry automático
- [ ] **1.3**: Audit de fluxo mobile
  - Testar em Android e iOS
  - Testar com diferentes navegadores
  - Logs detalhados de cada passo
- [ ] **1.4**: Centralizar state de auth
  - Usar uma store unificada (Zustand ou Context melhorado)
  - Sincronizar localStorage/sessionStorage
  - Cleanup garantido em erro

### Fase 2: Sessão (CRÍTICO) 🔴

**Objetivo**: Sessão resiliente e consistente

- [ ] **2.1**: Implementar refresh token
  - Bearer token + refresh token
  - Middleware para refresh automático
  - Retry transparente se expirado
- [ ] **2.2**: Validação de sessão em tempo real
  - Verificar se user ainda tem acesso à org
  - Verificar se role mudou
  - Invalidar cache em mudanças
- [ ] **2.3**: Erros específicos na API
  - 401 para sessão expirada
  - 403 para acesso negado
  - 400 para dados inválidos
  - Cliente pode retry/logout conforme erro

### Fase 3: Convites (IMPORTANTE) 🟠

**Objetivo**: Fluxo de convites claro e resiliente

- [ ] **3.1**: Clarificar tipos de convite
  - `team_invite`: Convida pessoa para organização (OWNER/STAFF)
  - `client_invite`: Vincula pessoa como cliente ou cria novo cliente
- [ ] **3.2**: Feedback visual de status
  - Mostrar ao usuário que convite foi aceito
  - Redirecionar automaticamente (com destino claro)
  - Mostrar erro se expirado/inválido
- [ ] **3.3**: Garantir consistência de dados
  - Usar transação completa Prisma
  - Validar Firestore em background
  - Retry se Firestore falhar

### Fase 4: RBAC (IMPORTANTE) 🟠

**Objetivo**: Permissões confiáveis e rastreáveis

- [ ] **4.1**: Adicionar cache com invalidação
  - Redis ou in-memory com TTL
  - Invalidar ao mudar role
- [ ] **4.2**: Adicionar auditoria
  - Log de permissões negadas
  - Log de mudanças de role
  - Log de acesso a dados sensíveis
- [ ] **4.3**: Testar cenários edge cases
  - User em múltiplas orgs
  - Role mudança mid-request
  - Org deletion while user in session

### Fase 5: Dashboard & Fluxos (DEPOIS)

- [ ] **5.1**: Auditar cada página/fluxo principal
- [ ] **5.2**: Melhorar UX de erros
- [ ] **5.3**: Adicionar feedback visual consistente

---

## 📝 PRÓXIMOS PASSOS

1. Confirmar prioridades com o time
2. Começar com Fase 1 (Login)
3. Criar PRs pequenas e testáveis
4. Cada mudança com testes E2E

---

## 📂 Arquivos-chave para referência

- `src/context/UserContext.tsx` - Lógica de auth
- `src/app/api/session/route.ts` - Session API
- `src/lib/permissions.ts` - RBAC rules
- `src/services/auth/session.ts` - Session profile
- `src/services/auth/onboarding.ts` - User onboarding
