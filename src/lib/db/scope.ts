import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

/**
 * Executa operações dentro de uma transação vinculada a um escopo de organização
 * usando variáveis de sessão Postgres. Útil para políticas RLS que referenciam
 * `current_setting('app.current_org', true)`.
 */
export async function withOrgScope<T>(
  orgId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_org', $1, true)`,
      orgId
    )
    return fn(tx)
  })
}
