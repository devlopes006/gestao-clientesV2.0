import '@/lib/env'
import AdminReconcileService from '@/services/financial/AdminReconcileService'

async function main() {
  const orgId = process.env.RECONCILE_ORG_ID || 'cmi3s1whv0002cmpwzddysc4j'
  const year = parseInt(process.env.RECONCILE_YEAR || '2025')
  const month = parseInt(process.env.RECONCILE_MONTH || '10')
  const targetIncome = process.env.RECONCILE_TARGET_INCOME
    ? Number(process.env.RECONCILE_TARGET_INCOME)
    : null
  const targetExpense = process.env.RECONCILE_TARGET_EXPENSE
    ? Number(process.env.RECONCILE_TARGET_EXPENSE)
    : null

  console.log('Running reconcile with', {
    orgId,
    year,
    month,
    targetIncome,
    targetExpense,
  })
  const report = await AdminReconcileService.reconcileMonth(
    orgId,
    year,
    month,
    targetIncome,
    targetExpense
  )

  // Convert Dates to ISO strings for safe JSON
  const safe = {
    before: report.before,
    after: report.after,
    changes: report.changes.map((c: any) => ({
      id: c.id,
      action: c.action,
      type: c.type,
      amount: c.amount,
      from: c.from ? new Date(c.from).toISOString() : null,
      to: c.to ? new Date(c.to).toISOString() : null,
    })),
  }

  console.log(JSON.stringify(safe, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
