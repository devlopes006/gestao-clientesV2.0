import { prisma } from '@/lib/prisma'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Service para sincronização Firestore
 * Fase 3 - Tarefa 3.3
 *
 * Mantém Firestore sincronizado com Prisma usando sistema de queue com retry
 */

/**
 * Adiciona item na fila de sincronização Firestore
 */
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

/**
 * Processa fila de sincronização
 * @param limit Número máximo de items para processar
 */
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
          memberships: {
            include: { org: true },
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
        console.warn(`[FirestoreSync] ⚠️ User não encontrado: ${item.userId}`)
        continue
      }

      // Sincronizar para Firestore
      const db = getFirestore()
      await db
        .collection('users')
        .doc(user.firebaseUid)
        .set(
          {
            orgIds: user.memberships.map((m) => m.orgId),
            roles: Object.fromEntries(
              user.memberships.map((m) => [m.orgId, m.role])
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

      console.log(`[FirestoreSync] ✅ Synced ${item.id} for user ${user.email}`)
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
        console.error(`[FirestoreSync] ❌ Failed ${item.id}: ${errorMsg}`)

        // TODO: Enviar alerta
        // await sendAlert(`Firestore sync failed for user ${item.userId}`, { item, error: errorMsg })
      }
    }
  }

  console.log(`[FirestoreSync] Finished processing ${items.length} items`)
}

/**
 * Conta items na fila por status
 */
export async function getQueueStats() {
  const [pending, synced, failed] = await Promise.all([
    prisma.firestoreSync.count({ where: { status: 'PENDING' } }),
    prisma.firestoreSync.count({ where: { status: 'SYNCED' } }),
    prisma.firestoreSync.count({ where: { status: 'FAILED' } }),
  ])

  return { pending, synced, failed }
}
