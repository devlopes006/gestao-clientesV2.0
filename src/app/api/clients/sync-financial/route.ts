import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { FinancialAutomationService } from '@/services/financial/FinancialAutomationService'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Sync each client in the org
    const clients = await prisma.client.findMany({
      where: { orgId: profile.orgId! },
    })
    const synced: string[] = []
    for (const c of clients) {
      await FinancialAutomationService.syncClientFinancialData(
        c.id,
        profile.orgId!
      )
      synced.push(c.id)
    }

    return NextResponse.json({
      success: true,
      updated: synced.length,
      clients: synced,
      message: `${synced.length} cliente(s) sincronizado(s)`,
    })
  } catch (error) {
    console.error('Error syncing client data:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao sincronizar dados dos clientes',
      },
      { status: 500 }
    )
  }
}
