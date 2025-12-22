/**
 * Script para processar fila de sincronização Firestore
 * Fase 3 - Tarefa 3.3
 *
 * Uso:
 *   node --require dotenv/config scripts/sync-firestore-queue.ts
 *
 * Ou com tsx:
 *   pnpm tsx scripts/sync-firestore-queue.ts
 *
 * Em produção, executar com cron ou job scheduler (ex: node-cron, Inngest, BullMQ)
 */

import { getQueueStats, processSyncQueue } from '../src/services/firestore-sync'

const INTERVAL_MS = 5 * 60 * 1000 // 5 minutos

async function main() {
  console.log('[FirestoreSync Cron] Starting...')
  console.log(`[FirestoreSync Cron] Running every ${INTERVAL_MS / 1000}s`)

  // Processar imediatamente
  try {
    const stats = await getQueueStats()
    console.log('[FirestoreSync Cron] Queue stats:', stats)

    if (stats.pending > 0) {
      await processSyncQueue(100)
    } else {
      console.log('[FirestoreSync Cron] No pending items')
    }
  } catch (error) {
    console.error('[FirestoreSync Cron] Error in initial run:', error)
  }

  // Agendar execução periódica
  setInterval(async () => {
    try {
      const stats = await getQueueStats()
      console.log('[FirestoreSync Cron] Queue stats:', stats)

      if (stats.pending > 0) {
        await processSyncQueue(100)
      } else {
        console.log('[FirestoreSync Cron] No pending items')
      }
    } catch (error) {
      console.error('[FirestoreSync Cron] Error:', error)
    }
  }, INTERVAL_MS)
}

main().catch((err) => {
  console.error('[FirestoreSync Cron] Fatal error:', err)
  process.exit(1)
})
