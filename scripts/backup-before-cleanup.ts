import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function backupBeforeCleanup() {
  const orgId = 'cmi3s1whv0002cmpwzddysc4j'

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('         BACKUP DE DADOS ANTES DA LIMPEZA')
  console.log('═══════════════════════════════════════════════════════════\n')

  // 1. Buscar todos os clientes e suas informações de contrato
  const clients = await pool.query(
    `SELECT id, name, email, phone, "contractStart", "paymentDay", plan, "contractValue"
     FROM "Client"
     WHERE "orgId" = $1
     ORDER BY name`,
    [orgId]
  )

  console.log('📋 CLIENTES E CONTRATOS:\n')
  const clientMap: Record<
    string,
    {
      id: string
      name: string
      email: string | null
      phone: string | null
      contractStart: Date | null
      paymentDay: number | null
      plan: string | null
      contractValue: number | null
    }
  > = {}

  for (const client of clients.rows) {
    const normalizedName = client.name.trim().toLowerCase()
    clientMap[normalizedName] = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      contractStart: client.contractStart,
      paymentDay: client.paymentDay,
      plan: client.plan,
      contractValue: client.contractValue,
    }

    console.log(`${client.name}:`)
    console.log(`  ID: ${client.id}`)
    console.log(
      `  Data início contrato: ${client.contractStart ? new Date(client.contractStart).toLocaleDateString('pt-BR') : 'N/A'}`
    )
    console.log(`  Dia vencimento: ${client.paymentDay || 'N/A'}`)
    console.log(`  Plano: ${client.plan || 'N/A'}`)
    console.log(
      `  Valor: R$ ${client.contractValue ? Number(client.contractValue).toFixed(2) : 'N/A'}`
    )
    console.log('')
  }

  // 2. Buscar faturas existentes de Out/Nov/Dez
  const invoices = await pool.query(
    `SELECT i.id, i.number, i."issueDate", i."dueDate", i.total, i.status, c.name as client_name
     FROM "Invoice" i
     LEFT JOIN "Client" c ON i."clientId" = c.id
     WHERE i."orgId" = $1
     AND i."issueDate" >= '2025-10-01'
     ORDER BY i."issueDate", c.name`,
    [orgId]
  )

  console.log('═'.repeat(60))
  console.log('\n📄 FATURAS EXISTENTES (OUT/NOV/DEZ):\n')

  interface InvoiceData {
    id: string
    number: string
    issueDate: Date
    dueDate: Date
    amount: number
    status: string
  }

  const invoicesByClient: Record<string, InvoiceData[]> = {}
  for (const invoice of invoices.rows) {
    if (!invoicesByClient[invoice.client_name]) {
      invoicesByClient[invoice.client_name] = []
    }
    invoicesByClient[invoice.client_name].push({
      id: invoice.id,
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      amount: Number(invoice.total),
      status: invoice.status,
    })

    console.log(`${invoice.client_name} - ${invoice.number}`)
    console.log(
      `  Emissão: ${new Date(invoice.issueDate).toLocaleDateString('pt-BR')}`
    )
    console.log(
      `  Vencimento: ${new Date(invoice.dueDate).toLocaleDateString('pt-BR')}`
    )
    console.log(`  Valor: R$ ${Number(invoice.total).toFixed(2)}`)
    console.log(`  Status: ${invoice.status}`)
    console.log('')
  }

  // 3. Buscar payments existentes
  const payments = await pool.query(
    `SELECT p.id, p.amount, p."paidAt", i.number as invoice_number, c.name as client_name
     FROM "Payment" p
     LEFT JOIN "Invoice" i ON p."invoiceId" = i.id
     LEFT JOIN "Client" c ON i."clientId" = c.id
     WHERE p."orgId" = $1
     AND p."paidAt" >= '2025-10-01'
     ORDER BY p."paidAt"`,
    [orgId]
  )

  console.log('═'.repeat(60))
  console.log('\n💳 PAYMENTS EXISTENTES:\n')

  for (const payment of payments.rows) {
    console.log(
      `${payment.client_name || 'N/A'} - R$ ${Number(payment.amount).toFixed(2)}`
    )
    console.log(
      `  Data: ${new Date(payment.paidAt).toLocaleDateString('pt-BR')}`
    )
    console.log(`  Fatura: ${payment.invoice_number || 'N/A'}`)
    console.log('')
  }

  // 4. Salvar em arquivo JSON
  const backup = {
    clients: clientMap,
    invoices: invoicesByClient,
    payments: payments.rows,
    timestamp: new Date().toISOString(),
  }

  const fs = require('fs')
  fs.writeFileSync(
    'backup-before-cleanup.json',
    JSON.stringify(backup, null, 2)
  )

  console.log('═'.repeat(60))
  console.log('\n✅ Backup salvo em: backup-before-cleanup.json\n')

  // 5. Resumo de clientes para mapeamento
  console.log('═'.repeat(60))
  console.log('\n📊 MAPEAMENTO DE CLIENTES:\n')

  const clientMapping = {
    'zl sushi': clientMap['zl sushi'],
    isabel: clientMap['dra. alexandra'], // Isabel é a Dra. Alexandra
    alexandra: clientMap['dra. alexandra'],
    fabiana: clientMap['fabiane'],
    infinix: clientMap['infinix'],
    manu: clientMap['manu nails desinger'],
    mané: clientMap['mané mineira'],
    'mane mineira': clientMap['mané mineira'],
    ariane: clientMap['ariane'],
    unimarcas: clientMap['unimarcas'],
    fabi: clientMap['fabiane'],
    distribuidora: clientMap['k´delícia'],
  }

  console.log('Mapeamento pronto para uso:\n')
  for (const [key, value] of Object.entries(clientMapping)) {
    if (value) {
      console.log(`  ${key} → ${value.name} (${value.id.substring(0, 8)}...)`)
    }
  }

  console.log('\n')
  await pool.end()
}

backupBeforeCleanup().catch(console.error)
