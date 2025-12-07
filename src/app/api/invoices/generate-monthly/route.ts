import {
  InvoiceService,
  generateMonthlyInvoicesInput,
} from '@/domain/invoices/InvoiceService'
import { ClientPrismaRepository } from '@/infrastructure/prisma/ClientPrismaRepository'
import { InvoicePrismaRepository } from '@/infrastructure/prisma/InvoicePrismaRepository'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const parsed = generateMonthlyInvoicesInput
      .extend({
        orgId: z.string().min(1).default(profile.orgId!),
      })
      .safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const service = new InvoiceService(
      new ClientPrismaRepository(prisma as any),
      new InvoicePrismaRepository(prisma as any)
    )
    const results = await service.generateMonthlyInvoices(parsed.data)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error generating monthly invoices:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao gerar faturas mensais',
      },
      { status: 500 }
    )
  }
}
