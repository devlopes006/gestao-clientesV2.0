# 🎯 FASE 3: CONVITES - PLANO DE EXECUÇÃO

**Duração estimada**: 1-2 dias  
**Data início**: 24/12/2024  
**Prioridade**: 🟠 Importante  
**Status**: 🚧 Pronto para iniciar

---

## 📋 Resumo Executivo

Fase 3 é sobre **clarificar e melhorar o fluxo de convites** com 3 tarefas bem definidas:

| Tarefa    | O quê                                         | Impacto             | Esforço |
| --------- | --------------------------------------------- | ------------------- | ------- |
| **3.1**   | Enum `InviteType` (TEAM/CLIENT/CLIENT_CREATE) | Elimina ambiguidade | 4h      |
| **3.2**   | Renovação de convite expirado + UI            | Melhor UX           | 3h      |
| **3.3**   | Firestore sync queue + cron                   | Consistência dados  | 5h      |
| **Total** | 3 tarefas, 3 endpoints, 1 modelo Prisma       | Alto                | **12h** |

---

## 🎬 Começar Aqui

### 1️⃣ **Tarefa 3.1: Adicionar Enum `InviteType`** (Começa AQUI)

**O que é**: Adicionar campo `type` ao modelo `Invite` para diferenciar 3 tipos de convite.

**Por que**: Hoje está ambíguo se convite de CLIENT está vinculando a cliente existente ou criando nova.

**Tempo**: ~4 horas

#### Step 1.1: Modificar Schema Prisma

Arquivo: `prisma/schema.prisma`

```prisma
model Invite {
  id        String   @id @default(cuid())
  token     String   @unique
  email     String
  orgId     String
  org       Organization @relation(fields: [orgId], references: [id])

  // ✅ NOVO:
  type      InviteType @default(TEAM_INVITE)

  // Existing:
  roleRequested String
  clientId  String?
  clientName String?  // Para CLIENT_CREATE
  expiresAt DateTime
  createdAt DateTime  @default(now())

  @@index([orgId])
  @@index([email])
  @@index([expiresAt])
}

// ✅ NOVO ENUM:
enum InviteType {
  TEAM_INVITE    // Convida alguém para entrar na org
  CLIENT_INVITE  // Vincula user a cliente EXISTENTE
  CLIENT_CREATE  // Cria NOVO cliente e vincula user
}
```

**✅ Validação**:

```bash
pnpm prisma:format  # Formattar schema
```

#### Step 1.2: Criar Migration

```bash
cd c:\Users\devel\projetos\gestao-clientes
pnpm prisma:migrate dev --name add_invite_type
```

**Output esperado**:

```
✔ Enter a name for this migration: add_invite_type
✔ Created migration folder and migration.sql

Your migration is ready. Review the changes and run:
prisma migrate deploy

PostgreSQL: ✔ Added type field to Invite
```

**✅ Validação**:

```bash
pnpm prisma:generate  # Regenerar Prisma client
```

#### Step 1.3: Atualizar Endpoint Accept

Arquivo: `src/app/api/invites/accept/route.ts`

**ANTES**:

```typescript
if (invite.roleRequested === 'CLIENT') {
  if (invite.clientId) {
    // Ambíguo
  } else {
    // Ambíguo
  }
}
```

**DEPOIS**:

```typescript
import { withAuth } from '@/app/api/session/with-auth'
import type { InviteType } from '@prisma/client'

export const POST = withAuth(async (req, { user }) => {
  const { token } = await req.json()

  // 1. Validar convite
  const invite = await prisma.invite.findUnique({ where: { token } })
  if (!invite) return error(404, 'Convite não encontrado')
  if (invite.expiresAt < new Date()) return error(400, 'Convite expirado')

  const userId = user.id

  // 2. Processar baseado no tipo
  let nextPath: string

  if (invite.type === 'TEAM_INVITE') {
    // Criar member na org
    await prisma.member.create({
      data: {
        userId,
        orgId: invite.orgId,
        role: invite.roleRequested as any, // TODO: validar tipo
      },
    })
    nextPath = '/dashboard'
  } else if (invite.type === 'CLIENT_INVITE') {
    // Vincular a cliente EXISTENTE
    if (!invite.clientId) {
      return error(400, 'ClientId necessário para CLIENT_INVITE')
    }

    const client = await prisma.client.findUnique({
      where: { id: invite.clientId },
      select: { id: true, orgId: true },
    })

    if (!client) {
      return error(404, 'Cliente não encontrado')
    }

    if (client.orgId !== invite.orgId) {
      return error(403, 'Cliente não pertence a essa org')
    }

    // Vincular
    await prisma.client.update({
      where: { id: invite.clientId },
      data: { clientUserId: userId },
    })

    nextPath = `/clients/${invite.clientId}`
  } else if (invite.type === 'CLIENT_CREATE') {
    // Criar NOVO cliente e vincular
    if (!invite.clientName) {
      return error(400, 'ClientName necessário para CLIENT_CREATE')
    }

    const newClient = await prisma.client.create({
      data: {
        name: invite.clientName,
        orgId: invite.orgId,
        clientUserId: userId,
      },
    })

    nextPath = `/clients/${newClient.id}`
  } else {
    return error(400, `Tipo de convite inválido: ${invite.type}`)
  }

  // 3. Marcar como aceito (optional)
  await prisma.invite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date(), acceptedBy: userId },
  })

  // 4. Retornar
  return ok({
    message: 'Convite aceito!',
    nextPath,
  })
})
```

**✅ Validação**:

```bash
pnpm type-check  # Deve passar sem erros
```

#### Step 1.4: Criar Testes E2E

Arquivo: `e2e/invites.spec.ts` (NOVO)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Invites Flow', () => {
  test('3.1.1 TEAM_INVITE - Usuário adicionado ao time', async ({ page }) => {
    // TODO:
    // 1. Criar invite com type=TEAM_INVITE
    // 2. Acessar link /invites/{token}
    // 3. Login
    // 4. Aceitar convite
    // 5. Verificar que member foi criado
    // 6. Dashboard deveria estar acessível
  })

  test('3.1.2 CLIENT_INVITE - Vinculado a cliente existente', async ({
    page,
  }) => {
    // TODO:
    // 1. Criar cliente existente
    // 2. Criar invite com type=CLIENT_INVITE e clientId
    // 3. Acessar link
    // 4. Aceitar
    // 5. Verificar que client.clientUserId foi atualizado
    // 6. Redirecionar para /clients/{id}
  })

  test('3.1.3 CLIENT_CREATE - Novo cliente criado e vinculado', async ({
    page,
  }) => {
    // TODO:
    // 1. Criar invite com type=CLIENT_CREATE e clientName
    // 2. Acessar link
    // 3. Aceitar
    // 4. Verificar que novo cliente foi criado
    // 5. Verificar que client.clientUserId é o novo user
    // 6. Redirecionar para /clients/{newId}
  })

  test('3.1.4 Erro - clientId missing para CLIENT_INVITE', async ({ page }) => {
    // TODO: Verificar que retorna 400
  })

  test('3.1.5 Erro - clientName missing para CLIENT_CREATE', async ({
    page,
  }) => {
    // TODO: Verificar que retorna 400
  })
})
```

**✅ Executar**:

```bash
pnpm e2e --spec=e2e/invites.spec.ts
```

---

### 2️⃣ **Tarefa 3.2: Convite Expirado + Renovação** (Depois de 3.1)

**O que é**: Permitir que user com convite expirado possa solicitar novo convite.

**Por que**: Melhor UX do que "desculpa, convite expirou, entre em contato com admin".

**Tempo**: ~3 horas

#### Step 2.1: Criar Endpoint `/api/invites/resend`

Arquivo: `src/app/api/invites/resend/route.ts` (NOVO)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { generateToken } from '@/lib/crypto'

export const POST = async (req: NextRequest) => {
  try {
    const { token } = await req.json()

    // 1. Encontrar convite
    const invite = await prisma.invite.findUnique({ where: { token } })

    if (!invite) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    // 2. Verificar se ainda é válido
    if (invite.expiresAt > new Date()) {
      return NextResponse.json(
        { error: 'Esse convite ainda é válido' },
        { status: 400 }
      )
    }

    // 3. Gerar novo token
    const newToken = generateToken()
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 dias

    // 4. Atualizar invite
    const updated = await prisma.invite.update({
      where: { id: invite.id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    })

    // 5. Enviar email
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invites/${newToken}`

    await sendEmail({
      to: invite.email,
      template: 'invite-renewed',
      data: {
        inviteLink,
        expiresAt: newExpiresAt.toLocaleDateString('pt-BR'),
      },
    })

    // 6. Retornar sucesso
    return NextResponse.json({
      ok: true,
      message: 'Convite renovado! Verifique seu email.',
    })
  } catch (error) {
    console.error('Error resending invite:', error)
    return NextResponse.json(
      { error: 'Erro ao renovar convite' },
      { status: 500 }
    )
  }
}
```

**✅ Validação**:

```bash
pnpm type-check
```

#### Step 2.2: Criar Componente de Convite Expirado

Arquivo: `src/components/invites/ExpiredInviteCard.tsx` (NOVO)

```typescript
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ExpiredInviteCardProps {
  token: string
  expiresAt: Date
  adminEmail: string
}

export function ExpiredInviteCard({
  token,
  expiresAt,
  adminEmail
}: ExpiredInviteCardProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleResend = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/invites/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Convite renovado! Verifique seu email.'
        })
      } else {
        const error = await res.json()
        setMessage({
          type: 'error',
          text: error.error || 'Erro ao renovar convite'
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erro na conexão. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm'>
      <h3 className='font-semibold text-yellow-900'>Convite Expirado</h3>
      <p className='mt-1 text-yellow-800'>
        Esse convite expirou em{' '}
        {format(new Date(expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>

      {message && (
        <div className={`mt-3 rounded p-2 ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {!message?.type || message.type === 'error' ? (
        <button
          onClick={handleResend}
          disabled={loading}
          className='mt-3 rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 disabled:opacity-50'
        >
          {loading ? 'Renovando...' : 'Solicitar novo convite'}
        </button>
      ) : null}

      <p className='mt-4 border-t border-yellow-200 pt-3 text-yellow-700'>
        <strong>Dúvidas?</strong> Entre em contato:{' '}
        <code className='rounded bg-yellow-100 px-2 py-1'>{adminEmail}</code>
      </p>
    </div>
  )
}
```

#### Step 2.3: Integrar no Fluxo de Login

Arquivo: `src/app/invites/[token]/page.tsx` (modificar ou criar)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { ExpiredInviteCard } from '@/components/invites/ExpiredInviteCard'
import { AuthCard } from '@/components/login/AuthCard'
import { prisma } from '@/lib/prisma'

export default function InvitePage({ params }: { params: { token: string } }) {
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInvite() {
      const res = await fetch(`/api/invites/${params.token}`)
      if (res.ok) {
        setInvite(await res.json())
      }
      setLoading(false)
    }
    loadInvite()
  }, [params.token])

  if (loading) return <div>Carregando...</div>

  if (!invite) {
    return <div>Convite não encontrado</div>
  }

  const now = new Date()
  const isExpired = new Date(invite.expiresAt) < now

  if (isExpired) {
    return (
      <div className='max-w-md mx-auto'>
        <ExpiredInviteCard
          token={params.token}
          expiresAt={invite.expiresAt}
          adminEmail={invite.adminEmail || 'admin@example.com'}
        />
      </div>
    )
  }

  return (
    <div>
      <p>Você foi convidado para: {invite.orgName}</p>
      <AuthCard invite={invite} />
    </div>
  )
}
```

**✅ Validação**:

```bash
pnpm type-check
```

---

### 3️⃣ **Tarefa 3.3: Firestore Sync Queue** (Depois de 3.2)

**O que é**: Queue para sincronizar Firestore quando invites são aceitos.

**Por que**: Garante que Firestore fica sincronizado mesmo se falhar na primeira tentativa.

**Tempo**: ~5 horas

#### Step 3.1: Criar Modelo FirestoreSync

Arquivo: `prisma/schema.prisma`

```prisma
model FirestoreSync {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  action    String    // 'ADD_ORG', 'REMOVE_ORG', 'UPDATE_ROLE'
  data      Json      // {orgId, role} etc

  status    String    @default("PENDING")  // PENDING, SYNCED, FAILED
  attempts  Int       @default(0)
  lastError String?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

**Migration**:

```bash
pnpm prisma:migrate dev --name add_firestore_sync
```

#### Step 3.2: Criar Service

Arquivo: `src/services/firestore-sync.ts` (NOVO)

```typescript
import { prisma } from '@/lib/prisma'
import { db } from '@/lib/firebase/admin'

export async function queueFirestoreSync(
  userId: string,
  action: string,
  data: any
) {
  return prisma.firestoreSync.create({
    data: {
      userId,
      action,
      data,
    },
  })
}

export async function processSyncQueue(limit = 100) {
  const items = await prisma.firestoreSync.findMany({
    where: { status: 'PENDING' },
    take: limit,
    orderBy: { createdAt: 'asc' },
  })

  console.log(`[FirestoreSync] Processing ${items.length} items...`)

  for (const item of items) {
    try {
      // Buscar user com seus orgs
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        include: {
          members: {
            include: { organization: true },
          },
        },
      })

      if (!user) {
        // User deletado, marcar como failed
        await prisma.firestoreSync.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            lastError: 'User não encontrado',
            attempts: { increment: 1 },
          },
        })
        continue
      }

      // Sincronizar para Firestore
      await db
        .collection('users')
        .doc(user.firebaseUid)
        .set(
          {
            orgIds: user.members.map((m) => m.orgId),
            roles: Object.fromEntries(
              user.members.map((m) => [m.orgId, m.role])
            ),
            lastSync: new Date(),
          },
          { merge: true }
        )

      // Marcar como sincronizado
      await prisma.firestoreSync.update({
        where: { id: item.id },
        data: {
          status: 'SYNCED',
          attempts: { increment: 1 },
        },
      })

      console.log(`[FirestoreSync] ✅ Synced ${item.id}`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      const newAttempts = item.attempts + 1

      if (newAttempts < 5) {
        // Retry
        await prisma.firestoreSync.update({
          where: { id: item.id },
          data: {
            status: 'PENDING',
            attempts: newAttempts,
            lastError: errorMsg,
          },
        })
        console.warn(
          `[FirestoreSync] ⚠️ Retry ${item.id} (attempt ${newAttempts})`
        )
      } else {
        // Max retries exceeded
        await prisma.firestoreSync.update({
          where: { id: item.id },
          data: {
            status: 'FAILED',
            attempts: newAttempts,
            lastError: `Max retries exceeded: ${errorMsg}`,
          },
        })
        console.error(`[FirestoreSync] ❌ Failed ${item.id}`)

        // TODO: Enviar alerta
        // await sendAlert(`Firestore sync failed for user ${item.userId}`, { item, error: errorMsg })
      }
    }
  }
}
```

**✅ Validação**:

```bash
pnpm type-check
```

#### Step 3.3: Chamar Queue no Accept

Modificar: `src/app/api/invites/accept/route.ts`

```typescript
import { queueFirestoreSync } from '@/services/firestore-sync'

export const POST = withAuth(async (req, { user }) => {
  // ... (código existente da tarefa 3.1)

  // Quando aceitar, queue sync
  await queueFirestoreSync(user.id, 'ADD_ORG', {
    orgId: invite.orgId,
    role: invite.roleRequested,
  })

  // Retornar sucesso
  return ok({ nextPath })
})
```

#### Step 3.4: Criar Cron Job

Arquivo: `scripts/sync-firestore-queue.ts` (NOVO)

```typescript
/**
 * Script para processar fila de sincronização Firestore
 *
 * Uso:
 *   node --require dotenv/config scripts/sync-firestore-queue.ts
 *
 * Ou com tsx:
 *   pnpm tsx scripts/sync-firestore-queue.ts
 *
 * Em produção, executar com cron ou job scheduler (ex: node-cron, Inngest)
 */

import { processSyncQueue } from '../src/services/firestore-sync'

const INTERVAL_MS = 5 * 60 * 1000 // 5 minutos

async function main() {
  console.log('[FirestoreSync Cron] Starting...')
  console.log(`[FirestoreSync Cron] Running every ${INTERVAL_MS / 1000}s`)

  // Processar imediatamente
  try {
    await processSyncQueue(100)
  } catch (error) {
    console.error('[FirestoreSync Cron] Error in initial run:', error)
  }

  // Agendar execução periódica
  setInterval(async () => {
    try {
      await processSyncQueue(100)
    } catch (error) {
      console.error('[FirestoreSync Cron] Error:', error)
    }
  }, INTERVAL_MS)
}

main()
```

**✅ Testar**:

```bash
pnpm tsx scripts/sync-firestore-queue.ts
# Ctrl+C para parar
```

#### Step 3.5: Criar Testes

Arquivo: `test/services/firestore-sync.test.ts` (NOVO)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { processSyncQueue } from '@/services/firestore-sync'

describe('FirestoreSync', () => {
  beforeEach(async () => {
    // Limpar items antes de cada teste
    await prisma.firestoreSync.deleteMany({})
  })

  it('3.3.1 Should sync user to Firestore on first attempt', async () => {
    // TODO
  })

  it('3.3.2 Should retry failed items', async () => {
    // TODO
  })

  it('3.3.3 Should mark as FAILED after 5 attempts', async () => {
    // TODO
  })

  it('3.3.4 Should handle missing user gracefully', async () => {
    // TODO
  })
})
```

---

## ✅ Validação Final

Após completar as 3 tarefas, rodar:

```bash
# 1. Type-check
pnpm type-check

# 2. Testes
pnpm test

# 3. Testes E2E (se implementou)
pnpm e2e --spec=e2e/invites.spec.ts

# 4. Build
pnpm build:next
```

**Esperado**:

- ✅ Type-check: 0 errors
- ✅ Tests: todos passando
- ✅ Build: sucesso

---

## 📝 Checklist de Conclusão

### Tarefa 3.1: InviteType

- [ ] Schema modificado com enum `InviteType`
- [ ] Migration criada: `add_invite_type`
- [ ] Endpoint `/api/invites/accept` atualizado com switch/case
- [ ] Testes E2E: 3 tipos de convite
- [ ] Type-check passando

### Tarefa 3.2: Convite Expirado

- [ ] Endpoint `/api/invites/resend` implementado
- [ ] Componente `ExpiredInviteCard` criado
- [ ] Integrado no fluxo de login (`/invites/[token]`)
- [ ] Email de renovação enviado
- [ ] Type-check passando

### Tarefa 3.3: Firestore Sync

- [ ] Modelo `FirestoreSync` no Prisma
- [ ] Migration criada
- [ ] Service `processSyncQueue()` implementado
- [ ] Queue chamada em `POST /api/invites/accept`
- [ ] Cron job `scripts/sync-firestore-queue.ts` criado
- [ ] Testes unitários (básicos)
- [ ] Type-check passando

### Final

- [ ] `pnpm type-check` = 0 errors ✅
- [ ] `pnpm test` = todos passando ✅
- [ ] `pnpm build:next` = sucesso ✅
- [ ] Documentação atualizada
- [ ] Pronto para merge em `develop`

---

## 🚀 Próximos Passos

Após Fase 3 concluída:

1. **Code review** dos 3 arquivos novos
2. **Deploy em staging**
3. **QA testing** dos 3 tipos de convite
4. **Merge em develop** (quando QA passou)
5. **Fase 4**: RBAC + Cache de permissões

---

## 📞 Referências

- [FASES_2_3_4_ROTEIRO.md](FASES_2_3_4_ROTEIRO.md) - Visão geral de todas as fases
- [FASE_2_STATUS_FINAL.md](FASE_2_STATUS_FINAL.md) - Detalhes da Fase 2
- Prisma Docs: https://www.prisma.io/docs/orm/prisma-client
- Firebase Admin: https://firebase.google.com/docs/database/admin/start

---

**Tempo estimado total: 12 horas**  
**Status**: 🚧 Pronto para começar  
**Criado**: 23/12/2024
