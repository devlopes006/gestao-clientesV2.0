import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Normalize lowercase to uppercase for Finance.type
    const updatedIncome = await prisma.$executeRawUnsafe(
      `UPDATE "Finance"
       SET type = 'INCOME'
       WHERE UPPER(type) = 'INCOME' AND type <> 'INCOME'`
    )

    const updatedExpense = await prisma.$executeRawUnsafe(
      `UPDATE "Finance"
       SET type = 'EXPENSE'
       WHERE UPPER(type) = 'EXPENSE' AND type <> 'EXPENSE'`
    )

    const rows: Array<{ type: string; count: bigint }> =
      await prisma.$queryRawUnsafe(
        `SELECT type, COUNT(*)::bigint AS count
       FROM "Finance"
       GROUP BY type
       ORDER BY type`
      )

    return NextResponse.json({
      updatedIncome,
      updatedExpense,
      distribution: rows,
    })
  } catch (error) {
    console.error('[maintenance:normalize] Error:', error)
    return NextResponse.json({ error: 'Failed to normalize' }, { status: 500 })
  }
}
