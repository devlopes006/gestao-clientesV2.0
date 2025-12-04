import { prisma } from '@/lib/prisma'

async function main() {
  console.log('\n=== NORMALIZANDO TIPOS DO FINANCE (executeRaw) ===\n')

  // Atualiza incomes minúsculos para INCOME
  const resIncome = await prisma.$executeRawUnsafe(
    `UPDATE "Finance"
     SET type = 'INCOME'
     WHERE UPPER(type) = 'INCOME'
       AND type <> 'INCOME'`
  )

  // Atualiza expenses minúsculos para EXPENSE
  const resExpense = await prisma.$executeRawUnsafe(
    `UPDATE "Finance"
     SET type = 'EXPENSE'
     WHERE UPPER(type) = 'EXPENSE'
       AND type <> 'EXPENSE'`
  )

  console.log(`✅ income→INCOME atualizados: ${resIncome}`)
  console.log(`✅ expense→EXPENSE atualizados: ${resExpense}`)

  const rows: Array<{ type: string; count: bigint }> =
    await prisma.$queryRawUnsafe(
      `SELECT type, COUNT(*)::bigint AS count
     FROM "Finance"
     GROUP BY type
     ORDER BY type`
    )

  console.log('\n📊 Tipos atuais no Finance:')
  for (const r of rows) {
    console.log(` - ${r.type}: ${String(r.count)} registros`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
