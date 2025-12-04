import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function monthlySummary() {
  const res = await pool.query(`
    SELECT EXTRACT(MONTH FROM f.date) AS month,
           EXTRACT(YEAR FROM f.date) AS year,
           SUM(CASE WHEN f.type='INCOME' THEN f.amount ELSE 0 END) AS income,
           SUM(CASE WHEN f.type='EXPENSE' THEN f.amount ELSE 0 END) AS expense
    FROM "Finance" f
    WHERE f."orgId"='cmi3s1whv0002cmpwzddysc4j'
      AND f.date >= '2025-09-01' AND f.date < '2026-01-01'
    GROUP BY year, month
    ORDER BY year, month`)

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('         RESUMO MENSAL (DB)')
  console.log('═══════════════════════════════════════════════════════════\n')
  for (const r of res.rows) {
    const name = new Date(
      Number(r.year),
      Number(r.month) - 1
    ).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    console.log(
      `${name}: Receitas R$ ${Number(r.income).toFixed(2)} | Despesas R$ ${Number(r.expense).toFixed(2)} | Saldo R$ ${(Number(r.income) - Number(r.expense)).toFixed(2)}`
    )
  }
  console.log('\n═══════════════════════════════════════════════════════════\n')

  await pool.end()
}

monthlySummary()
