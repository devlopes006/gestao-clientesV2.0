import dotenv from 'dotenv'
import { prisma } from '../src/lib/prisma'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function listClients(orgId: string) {
  const clients = await prisma.client.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      paymentDay: true,
      isInstallment: true,
      installmentCount: true,
      installmentValue: true,
      contractValue: true,
    },
    orderBy: { name: 'asc' },
  })

  console.log('\n=== CLIENTES CADASTRADOS ===\n')
  clients.forEach((c) => {
    console.log(`Nome: "${c.name}"`)
    console.log(`  ID: ${c.id}`)
    console.log(`  Dia de Pagamento: ${c.paymentDay || 'não definido'}`)
    console.log(`  Parcelado: ${c.isInstallment ? 'SIM' : 'NÃO'}`)
    if (c.isInstallment) {
      console.log(
        `  Quantidade de Parcelas: ${c.installmentCount || 'não definido'}`
      )
      console.log(
        `  Valor da Parcela: R$ ${c.installmentValue || 'não definido'}`
      )
    }
    console.log(`  Valor Contrato: R$ ${c.contractValue || 'não definido'}`)
    console.log('')
  })
  console.log(`Total: ${clients.length} clientes\n`)
}

async function main() {
  const orgId = process.argv[2] || 'cmi3s1whv0002cmpwzddysc4j'
  await listClients(orgId)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
