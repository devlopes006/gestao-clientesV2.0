import dotenv from 'dotenv'
import { prisma } from '../src/lib/prisma'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function checkInvoices() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  const invoices = await prisma.invoice.findMany({
    where: { orgId },
    select: {
      id: true,
      number: true,
      client: { select: { name: true } },
      total: true,
      dueDate: true,
      status: true,
    },
    orderBy: { dueDate: 'asc' },
  })

  console.log(`\nTotal de faturas: ${invoices.length}\n`)

  const byClient: Record<string, number> = {}

  invoices.forEach((inv) => {
    const clientName = inv.client.name
    byClient[clientName] = (byClient[clientName] || 0) + 1
    console.log(
      `${inv.number} - ${clientName} - R$ ${inv.total.toFixed(2)} - ${inv.dueDate.toISOString().split('T')[0]} - ${inv.status}`
    )
  })

  console.log('\n--- Resumo por Cliente ---')
  Object.entries(byClient).forEach(([client, count]) => {
    console.log(`${client}: ${count} faturas`)
  })

  await prisma.$disconnect()
}

checkInvoices()
