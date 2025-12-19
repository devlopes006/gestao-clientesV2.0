import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const from = searchParams.get('from')
    const orgId = searchParams.get('orgId')

    const where: any = {}
    if (from) where.from = from
    if (orgId) where.orgId = orgId

    const messages = await prisma.whatsAppMessage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    })
  } catch (error) {
    console.error('[WhatsApp Messages API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
