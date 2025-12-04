import fs from 'fs'
import path from 'path'
import { prisma } from '../src/lib/prisma'

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthRange(start: Date, end: Date) {
  const months: Date[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cur <= last) {
    months.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

async function main() {
  // compute min/max dates from finances and payments
  const minFin = await prisma.finance.findFirst({
    orderBy: { date: 'asc' },
    select: { date: true },
  })
  const maxFin = await prisma.finance.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  })
  const minPay = await prisma.payment.findFirst({
    orderBy: { paidAt: 'asc' },
    select: { paidAt: true },
  })
  const maxPay = await prisma.payment.findFirst({
    orderBy: { paidAt: 'desc' },
    select: { paidAt: true },
  })

  const dates: Date[] = []
  if (minFin?.date) dates.push(new Date(minFin.date))
  if (maxFin?.date) dates.push(new Date(maxFin.date))
  if (minPay?.paidAt) dates.push(new Date(minPay.paidAt))
  if (maxPay?.paidAt) dates.push(new Date(maxPay.paidAt))

  if (dates.length === 0) {
    console.log('No finance or payment records found')
    process.exit(0)
  }

  const start = new Date(Math.min(...dates.map((d) => d.getTime())))
  const end = new Date(Math.max(...dates.map((d) => d.getTime())))

  const months = monthRange(
    new Date(start.getFullYear(), start.getMonth(), 1),
    new Date(end.getFullYear(), end.getMonth(), 1)
  )

  const rows: string[] = []
  rows.push(
    'month,finances_income,finances_expense,finances_net,finances_count,payments_sum,payments_count,finances_excl_duplicates'
  )

  for (const m of months) {
    const monthStart = new Date(m.getFullYear(), m.getMonth(), 1)
    const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1)

    const fin = await prisma.finance.findMany({
      where: { date: { gte: monthStart, lt: monthEnd } },
      select: { amount: true, type: true, metadata: true },
    })
    const pay = await prisma.payment.findMany({
      where: { paidAt: { gte: monthStart, lt: monthEnd } },
      select: { amount: true },
    })

    const income = fin
      .filter((f) => f.type === 'income')
      .reduce((s, f) => s + f.amount, 0)
    const expense = fin
      .filter((f) => f.type === 'expense')
      .reduce((s, f) => s + f.amount, 0)
    const net = income - expense
    const finCount = fin.length
    const paySum = pay.reduce((s, p) => s + p.amount, 0)
    const payCount = pay.length
    const finExclDup = fin
      .filter((f) => !(f.metadata && (f.metadata as any).duplicateOf))
      .reduce((s, f) => s + (f.type === 'income' ? f.amount : -f.amount), 0)

    rows.push(
      `${monthKey(m)},${income.toFixed(2)},${expense.toFixed(2)},${net.toFixed(2)},${finCount},${paySum.toFixed(2)},${payCount},${finExclDup.toFixed(2)}`
    )
  }

  const reportDir = path.join(process.cwd(), 'reconcile-reports')
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir)
  const out = path.join(
    reportDir,
    `monthly-reconcile-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
  )
  fs.writeFileSync(out, rows.join('\n'))
  console.log('Report written to', out)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
