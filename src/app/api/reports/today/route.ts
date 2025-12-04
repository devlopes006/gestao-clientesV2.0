import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { TransactionStatus, TransactionType } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const now = new Date()
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    )
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    )

    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          orgId: profile.orgId,
          type: TransactionType.INCOME,
          status: TransactionStatus.CONFIRMED,
          deletedAt: null,
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: {
          orgId: profile.orgId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.CONFIRMED,
          deletedAt: null,
          date: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      date: start.toISOString().slice(0, 10),
      totalIncomeToday: income._sum.amount || 0,
      totalIncomeCount: income._count,
      totalExpenseToday: expense._sum.amount || 0,
      totalExpenseCount: expense._count,
      netToday: (income._sum.amount || 0) - (expense._sum.amount || 0),
    })
  } catch (error) {
    console.error('Error getting today summary:', error)
    return NextResponse.json(
      { error: 'Erro ao obter resumo do dia' },
      { status: 500 }
    )
  }
}
