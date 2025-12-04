import { prisma } from '../src/lib/prisma'

// Usage:
// pnpm dlx tsx scripts/mark-finance-reconciled.ts <financeId> <paymentId>
// If arguments are omitted, defaults will be used (for December/2025 example).

async function main() {
  const financeId = process.argv[2] || 'cmiqd2c1z0003nwcm0mjzfgex'
  const paymentId = process.argv[3] || 'cmiqd2c1f0002nwcmmh0m1p5y'

  const finance = await prisma.finance.findUnique({ where: { id: financeId } })
  if (!finance) {
    throw new Error(`Finance not found: ${financeId}`)
  }

  const metadata =
    typeof finance.metadata === 'object' && finance.metadata !== null
      ? (finance.metadata as any)
      : {}
  metadata.reconciledWithPayment = paymentId
  metadata.reconciledAt = new Date().toISOString()

  const newDescription = `${finance.description || ''}`.trim()
  const note = `(conciliado com payment ${paymentId})`
  const updatedDescription = newDescription ? `${newDescription} ${note}` : note

  const updated = await prisma.finance.update({
    where: { id: financeId },
    data: {
      metadata,
      description: updatedDescription,
    },
  })

  console.log('Updated finance:', {
    id: updated.id,
    metadata: updated.metadata,
    description: updated.description,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
