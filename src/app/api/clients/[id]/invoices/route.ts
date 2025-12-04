import { can, type AppRole } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id: clientId } = await params

    // Extract pagination parameters from query
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          clientId,
          orgId,
          deletedAt: null,
        },
        include: {
          items: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({
        where: {
          clientId,
          orgId,
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao listar faturas'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || !role)
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!can(role as AppRole, 'create', 'finance'))
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { id: clientId } = await params
    // Criação da fatura usando novo sistema
    try {
      const invoice = await prisma.invoice.create({
        data: {
          clientId,
          orgId,
          number: `INV-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'DRAFT',
          total: 0,
          subtotal: 0,
        },
        include: { items: true },
      })
      return NextResponse.json({ success: true, invoice })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido'
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      )
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao gerar fatura'
    const code = msg.includes('não encontrado') ? 404 : 400
    return NextResponse.json({ error: msg }, { status: code })
  }
}
