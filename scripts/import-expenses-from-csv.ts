import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const ORG_ID = 'cmi3s1whv0002cmpwzddysc4j'

function parseCSV(content: string) {
  const lines = content.trim().split(/\r?\n/)
  const _header = lines.shift()
  const rows = [] as Array<{
    date: Date
    value: number
    id: string
    description: string
  }>
  for (const line of lines) {
    // Handle commas inside quotes by simple CSV split respecting quotes
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
        continue
      }
      if (ch === ',' && !inQuotes) {
        parts.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    parts.push(current)
    if (parts.length < 4) continue
    const [dateStr, valueStr, ident, desc] = parts
    const [day, month, year] = dateStr.split('/').map(Number)
    const date = new Date(year, month - 1, day)
    const value = Number(valueStr)
    rows.push({ date, value, id: ident, description: desc })
  }
  return rows
}

async function importExpenses(csvPath: string) {
  const fullPath = resolve(csvPath)
  const content = readFileSync(fullPath, 'utf-8')
  const rows = parseCSV(content)

  console.log('═══════════════════════════════════════════════════════════')
  console.log('         IMPORTAÇÃO DE DESPESAS VIA CSV')
  console.log('═══════════════════════════════════════════════════════════\n')

  let inserted = 0
  const months: Record<string, number> = {}

  for (const row of rows) {
    // Only consider negative values as expenses
    if (row.value >= 0) continue

    const amount = Math.abs(row.value)
    const financeId = generateId()
    const now = new Date()

    await pool.query(
      `INSERT INTO "Finance" (
        "id", "orgId", "type", "amount", "description", "category", "date", "createdAt", "updatedAt"
      ) VALUES ($1, $2, 'EXPENSE', $3, $4, $5, $6, $7, $8)`,
      [
        financeId,
        ORG_ID,
        amount,
        row.description,
        inferCategory(row.description),
        row.date,
        now,
        now,
      ]
    )

    const key = `${row.date.getFullYear()}-${row.date.getMonth() + 1}`
    months[key] = (months[key] || 0) + amount
    inserted++
    console.log(
      `✅ ${row.date.toLocaleDateString('pt-BR')} - R$ ${amount.toFixed(
        2
      )} - ${row.description}`
    )
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log(`✅ Despesas inseridas: ${inserted}`)
  console.log('📊 Totais por mês:')
  const keys = Object.keys(months).sort()
  for (const k of keys) {
    const [year, month] = k.split('-')
    const name = new Date(Number(year), Number(month) - 1).toLocaleDateString(
      'pt-BR',
      { month: 'long', year: 'numeric' }
    )
    console.log(`  ${name}: R$ ${months[k].toFixed(2)}`)
  }
  console.log('═══════════════════════════════════════════════════════════\n')

  await pool.end()
}

function inferCategory(desc: string): string {
  const d = desc.toLowerCase()
  if (d.includes('ifood')) return 'ALIMENTAÇÃO'
  if (d.includes('telefonica') || d.includes('celular')) return 'TELEFONIA'
  if (d.includes('facebook') || d.includes('ads')) return 'MARKETING'
  if (d.includes('supermerc')) return 'MERCADO'
  if (d.includes('laundrexpress') || d.includes('lavander')) return 'SERVIÇOS'
  if (d.includes('receita federal')) return 'IMPOSTOS'
  if (d.includes('compra no débito')) return 'COMPRAS'
  return 'DESPESA'
}

function generateId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `c${ts}${rand}`.slice(0, 25)
}

const csvArg =
  process.argv[2] ||
  'c:/Users/devel/Downloads/NU_9784251776_03SET2025_01DEZ2025.csv'
importExpenses(csvArg).catch((e) => {
  console.error('❌ Erro ao importar despesas:', e)
  process.exit(1)
})
