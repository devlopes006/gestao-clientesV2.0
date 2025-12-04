import dotenv from 'dotenv'
import { prisma } from '../src/lib/prisma'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function testQueries() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n=== TESTE 1: Faturas ===')
  const invoices = await prisma.invoice.findMany({
    where: { orgId },
    include: { client: true },
    orderBy: { dueDate: 'desc' },
    take: 5,
  })

  console.log(`Total de faturas (5 primeiras): ${invoices.length}`)
  invoices.forEach((inv) => {
    console.log(`- ${inv.number}: ${inv.client.name} - R$ ${inv.total}`)
  })

  console.log('\n=== TESTE 2: Transações ===')
  const transactions = await prisma.transaction.findMany({
    where: { orgId },
    orderBy: { date: 'desc' },
    take: 10,
  })

  console.log(`Total de transações (10 primeiras): ${transactions.length}`)
  transactions.forEach((tx) => {
    console.log(
      `- ${tx.date.toISOString().split('T')[0]}: ${tx.type} - ${tx.description} - R$ ${tx.amount}`
    )
  })

  console.log('\n=== TESTE 3: Clientes ===')
  const clients = await prisma.client.findMany({
    where: { orgId },
    select: { id: true, name: true },
  })

  console.log(`Total de clientes: ${clients.length}`)
  clients.forEach((c) => console.log(`- ${c.name}`))

  await prisma.$disconnect()
}

testQueries()
