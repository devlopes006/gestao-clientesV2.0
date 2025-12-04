import { prisma } from '../src/lib/prisma'

async function main() {
  const org = 'cmi3s1whv0002cmpwzddysc4j'
  const from = new Date('2025-11-01')
  const to = new Date('2025-12-01')

  const finances = await prisma.finance.findMany({
    where: { orgId: org, type: 'income', date: { gte: from, lt: to } },
    select: {
      id: true,
      amount: true,
      clientId: true,
      date: true,
      description: true,
      metadata: true,
    },
  })

  const payments = await prisma.payment.findMany({
    where: { orgId: org, paidAt: { gte: from, lt: to } },
    select: {
      id: true,
      amount: true,
      clientId: true,
      invoiceId: true,
      paidAt: true,
      description: true,
      metadata: true,
    },
  })

  const finSum = finances.reduce((s, f) => s + f.amount, 0)
  const finSumExclDup = finances
    .filter((f) => !(f.metadata && (f.metadata as any).duplicateOf))
    .reduce((s, f) => s + f.amount, 0)
  const paySum = payments.reduce((s, p) => s + p.amount, 0)

  const perClient: Record<string, any> = {}
  for (const f of finances) {
    const cid = f.clientId || '__UNASSIGNED'
    perClient[cid] = perClient[cid] || {
      finance: 0,
      financeExclDup: 0,
      payment: 0,
      finances: [],
      payments: [],
    }
    perClient[cid].finance += f.amount
    if (!(f.metadata && (f.metadata as any).duplicateOf))
      perClient[cid].financeExclDup += f.amount
    perClient[cid].finances.push(f)
  }
  for (const p of payments) {
    const cid = p.clientId || '__UNASSIGNED'
    perClient[cid] = perClient[cid] || {
      finance: 0,
      financeExclDup: 0,
      payment: 0,
      finances: [],
      payments: [],
    }
    perClient[cid].payment += p.amount
    perClient[cid].payments.push(p)
  }

  console.log(
    JSON.stringify(
      {
        finSum,
        finSumExclDup,
        paySum,
        counts: { finances: finances.length, payments: payments.length },
        perClient,
      },
      null,
      2
    )
  )
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
