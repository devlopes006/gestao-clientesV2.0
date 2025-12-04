#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { prisma } from '../src/lib/prisma'

type Options = {
  orgId: string
  from?: string
  to?: string
  dryRun?: boolean
  action?: 'mark' | 'report'
}

function parseArgs(): Options {
  const argv = process.argv.slice(2)
  const opts: {
    orgId?: string
    from?: string
    to?: string
    dryRun?: boolean
    action?: 'mark' | 'report'
  } = { dryRun: true, action: 'report' }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--orgId' || a === '-o') opts.orgId = argv[++i]
    else if (a === '--from' || a === '-f') opts.from = argv[++i]
    else if (a === '--to' || a === '-t') opts.to = argv[++i]
    else if (a === '--apply' || a === '-a') opts.dryRun = false
    else if (a === '--action') opts.action = argv[++i]
  }
  if (!opts.orgId) throw new Error('Missing --orgId')
  return opts
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

async function run() {
  const opts = parseArgs()
  const from = opts.from
    ? new Date(opts.from)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const to = opts.to
    ? new Date(opts.to)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)

  console.log(
    `Reconciling finances for org=${opts.orgId} from=${from.toISOString()} to=${to.toISOString()} dryRun=${opts.dryRun}`
  )

  // Fetch incomes in range
  const finances = await prisma.finance.findMany({
    where: {
      orgId: opts.orgId,
      type: 'income',
      date: { gte: from, lt: to },
    },
    orderBy: { date: 'asc' },
  })

  // Group by clientId|amount|date(day)
  const groups = new Map<string, typeof finances>()
  for (const f of finances) {
    const client = f.clientId || 'UNASSIGNED'
    const key = `${client}::${f.amount.toFixed(2)}::${dayKey(new Date(f.date))}`
    const arr = groups.get(key) || []
    arr.push(f)
    groups.set(key, arr)
  }

  const duplicates: {
    key: string
    canonicalId: string
    duplicates: string[]
    clientId: string | null
    amount: number
    date: string
  }[] = []

  for (const [, arr] of groups) {
    if (arr.length > 1) {
      // choose canonical as earliest createdAt
      arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      const canonical = arr[0]
      const others = arr.slice(1)
      duplicates.push({
        key: k,
        canonicalId: canonical.id,
        duplicates: others.map((o) => o.id),
        clientId: canonical.clientId || null,
        amount: canonical.amount,
        date: dayKey(new Date(canonical.date)),
      })
    }
  }

  // Also look for duplicate payments by invoice
  const payments = await prisma.payment.findMany({
    where: { orgId: opts.orgId, paidAt: { gte: from, lt: to } },
    orderBy: { paidAt: 'asc' },
  })
  const paymentGroups = new Map<string, typeof payments>()
  for (const p of payments) {
    const key = `${p.invoiceId}::${p.amount.toFixed(2)}`
    const arr = paymentGroups.get(key) || []
    arr.push(p)
    paymentGroups.set(key, arr)
  }

  const duplicatePayments: {
    invoiceId: string
    canonicalId: string
    duplicates: string[]
    amount: number
  }[] = []
  for (const [, arr] of paymentGroups) {
    if (arr.length > 1) {
      arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      const canonical = arr[0]
      const others = arr.slice(1)
      duplicatePayments.push({
        invoiceId: canonical.invoiceId,
        canonicalId: canonical.id,
        duplicates: others.map((o) => o.id),
        amount: canonical.amount,
      })
    }
  }

  const nowStamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportDir = path.join(process.cwd(), 'reconcile-reports')
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir)
  const reportPath = path.join(
    reportDir,
    `reconcile-${opts.orgId}-${nowStamp}.csv`
  )

  const rows: string[] = []
  rows.push('type,clientId,canonicalId,duplicateIds,amount,date,notes')
  for (const d of duplicates) {
    rows.push(
      `finance,${d.clientId || ''},${d.canonicalId},"${d.duplicates.join('|')}",${d.amount},${d.date},duplicate_finance_group`
    )
  }
  for (const p of duplicatePayments) {
    rows.push(
      `payment, ,${p.canonicalId},"${p.duplicates.join('|')}",${p.amount},,duplicate_payment_group`
    )
  }

  fs.writeFileSync(reportPath, rows.join('\n'))
  console.log(`Report written to ${reportPath}`)

  if (!opts.dryRun) {
    console.log('Applying marks to duplicates...')
    for (const d of duplicates) {
      for (const id of d.duplicates) {
        try {
          await prisma.finance.update({
            where: { id },
            data: {
              metadata: {
                ...((await prisma.finance.findUnique({ where: { id } }))
                  ?.metadata || {}),
                duplicateOf: d.canonicalId,
              },
              description: `${(await prisma.finance.findUnique({ where: { id } }))?.description || ''} (duplicate of ${d.canonicalId})`,
            },
          })
        } catch (err) {
          console.error('Failed marking finance', id, err)
        }
      }
    }
    for (const p of duplicatePayments) {
      for (const id of p.duplicates) {
        try {
          await prisma.payment.update({
            where: { id },
            data: {
              metadata: { duplicateOf: p.canonicalId },
              description: `${(await prisma.payment.findUnique({ where: { id } }))?.description || ''} (duplicate of ${p.canonicalId})`,
            },
          })
        } catch (err) {
          console.error('Failed marking payment', id, err)
        }
      }
    }
    console.log('Marking complete.')
  } else {
    console.log('Dry run - no changes applied. Use --apply to mark duplicates.')
  }

  console.log('Done')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
