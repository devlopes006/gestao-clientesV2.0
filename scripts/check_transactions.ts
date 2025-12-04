import { prisma } from '../src/lib/prisma'

async function checkTransactions() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('🔍 Verificando transações de despesas...\n')

  // Status das transações
  const byStatus = await prisma.transaction.groupBy({
    by: ['status'],
    where: {
      orgId,
      type: 'EXPENSE',
      deletedAt: null,
    },
    _sum: { amount: true },
    _count: true,
  })

  console.log('📊 Resumo por STATUS:')
  byStatus.forEach((item) => {
    console.log(
      `  ${item.status}: ${item._count} transações = R$ ${item._sum.amount?.toFixed(2)}`
    )
  })

  // Por mês
  const byMonth = await prisma.$queryRaw<
    Array<{ month: string; total: number; count: number }>
  >`
    SELECT 
      TO_CHAR(date, 'YYYY-MM') as month,
      SUM(amount) as total,
      COUNT(*) as count
    FROM "Transaction"
    WHERE "orgId" = ${orgId}
      AND type = 'EXPENSE'
      AND "deletedAt" IS NULL
    GROUP BY TO_CHAR(date, 'YYYY-MM')
    ORDER BY month DESC
  `

  console.log('\n📅 Resumo por MÊS:')
  byMonth.forEach((item) => {
    console.log(
      `  ${item.month}: ${item.count} transações = R$ ${Number(item.total).toFixed(2)}`
    )
  })

  // Dezembro com status CONFIRMED
  const decemberConfirmed = await prisma.transaction.aggregate({
    where: {
      orgId,
      type: 'EXPENSE',
      deletedAt: null,
      status: 'CONFIRMED',
      date: {
        gte: new Date('2025-12-01'),
        lte: new Date('2025-12-31'),
      },
    },
    _sum: { amount: true },
    _count: true,
  })

  console.log('\n✅ Dezembro 2025 (status CONFIRMED):')
  console.log(
    `  ${decemberConfirmed._count} transações = R$ ${decemberConfirmed._sum.amount?.toFixed(2) || 0}`
  )

  // Últimas 5 transações
  const latest = await prisma.transaction.findMany({
    where: {
      orgId,
      type: 'EXPENSE',
      deletedAt: null,
    },
    select: {
      date: true,
      amount: true,
      status: true,
      description: true,
      category: true,
    },
    orderBy: { date: 'desc' },
    take: 5,
  })

  console.log('\n📝 Últimas 5 transações:')
  latest.forEach((t) => {
    console.log(
      `  ${t.date.toISOString().split('T')[0]} | ${t.status} | R$ ${t.amount.toFixed(2)} | ${t.description}`
    )
  })

  await prisma.$disconnect()
}

checkTransactions().catch(console.error)
