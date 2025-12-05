import {
  aggregateClientDelinquency,
  buildDelinquencyWhere,
  delinquencyAnalysisSchema,
  groupDelinquenciesByRiskLevel,
  topClientsByOverdueAmount,
  type DelinquencyAnalysisResponse,
} from '@/lib/advanced-reporting'
import { ApiResponseHandler } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: Request) {
  try {
    const profile = await getSessionProfile()

    // Validação de autorização
    if (!profile || !profile.orgId) {
      return ApiResponseHandler.unauthorized()
    }

    // Apenas OWNER pode acessar relatórios
    if (profile.role !== 'OWNER') {
      return ApiResponseHandler.forbidden()
    }

    // Parsear parâmetros
    const { searchParams } = new URL(request.url)
    const minDaysParam = searchParams.get('minDaysOverdue')
    const limitParam = searchParams.get('limit')

    const parsedParams = delinquencyAnalysisSchema.parse({
      minDaysOverdue: minDaysParam ? parseInt(minDaysParam) : 0,
      limit: limitParam ? parseInt(limitParam) : 50,
    })

    Sentry.captureMessage('Delinquency Analysis Request', {
      level: 'info',
      extra: {
        orgId: profile.orgId,
        minDaysOverdue: parsedParams.minDaysOverdue,
      },
    })

    // Buscar invoices por status (incluindo histórico para análise)
    const overdueInvoices = await prisma.invoice.findMany({
      where: buildDelinquencyWhere(profile.orgId, parsedParams.minDaysOverdue),
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: parsedParams.limit * 3, // Buscar mais para análise completa
    })

    // Buscar todos os invoices para análise de tendência
    const allInvoices = await prisma.invoice.findMany({
      where: {
        orgId: profile.orgId,
        status: { in: ['PAID', 'OPEN', 'OVERDUE'] },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
      take: 1000, // Limitar para performance
    })

    if (overdueInvoices.length === 0) {
      const emptyResponse: DelinquencyAnalysisResponse = {
        summary: {
          totalClientsAnalyzed: 0,
          activeClientsCount: 0,
          inactiveClientsCount: 0,
          delinquentClientsCount: 0,
          totalOverdueAmount: 0,
          averageOverdueDays: 0,
          delinquencyRate: 0,
        },
        byRiskLevel: {
          critical: [],
          high: [],
          medium: [],
          low: [],
        },
        topDelinquents: [],
        trends: [],
        metadata: {
          generatedAt: new Date().toISOString(),
          analysisDate: new Date().toISOString().split('T')[0],
          currency: 'BRL',
        },
      }

      return ApiResponseHandler.success(emptyResponse, 200, {
        message: 'Sem faturas vencidas no período analisado',
      })
    }

    // Agregar dados de delinquência
    const delinquencyMap = aggregateClientDelinquency(overdueInvoices)
    const delinquentClients = Array.from(delinquencyMap.values()).sort(
      (a, b) => b.overdueAmount - a.overdueAmount
    )

    // Agrupar por nível de risco
    const byRiskLevel = groupDelinquenciesByRiskLevel(delinquentClients)

    // Top delinquentes
    const topDelinquents = topClientsByOverdueAmount(delinquentClients, 10)

    // Análise de tendências
    const monthlyData = new Map<
      string,
      { overdueCount: number; overdueAmount: number }
    >()

    for (const invoice of allInvoices) {
      const month = invoice.issueDate.toISOString().slice(0, 7)
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { overdueCount: 0, overdueAmount: 0 })
      }

      if (invoice.status === 'OVERDUE') {
        const data = monthlyData.get(month)!
        data.overdueCount += 1
        data.overdueAmount += invoice.total || 0
      }
    }

    const sortedMonths = Array.from(monthlyData.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    )

    const trends: Array<{
      month: string
      delinquentCount: number
      overdueAmount: number
      trend: 'improving' | 'stable' | 'worsening'
    }> = []

    for (let i = 0; i < sortedMonths.length; i++) {
      const [month, data] = sortedMonths[i]
      const trend =
        i === 0
          ? ('stable' as const)
          : sortedMonths[i - 1][1].overdueAmount > data.overdueAmount
            ? ('improving' as const)
            : sortedMonths[i - 1][1].overdueAmount < data.overdueAmount
              ? ('worsening' as const)
              : ('stable' as const)

      trends.push({
        month,
        delinquentCount: data.overdueCount,
        overdueAmount: data.overdueAmount,
        trend,
      })
    }

    // Calcular estatísticas gerais
    const totalClientsAnalyzed = delinquentClients.length
    const activeClientsCount = delinquentClients.filter(
      (c) => c.clientStatus === 'ACTIVE'
    ).length
    const inactiveClientsCount = delinquentClients.filter(
      (c) => c.clientStatus === 'INACTIVE'
    ).length
    const totalOverdueAmount = delinquentClients.reduce(
      (sum, c) => sum + c.overdueAmount,
      0
    )
    const averageOverdueDays =
      totalClientsAnalyzed > 0
        ? Math.round(
            delinquentClients.reduce((sum, c) => sum + c.overdueDays, 0) /
              totalClientsAnalyzed
          )
        : 0

    // Taxa de inadimplência (clientes delinquentes vs total de clientes com invoices)
    const uniqueClients = new Set(allInvoices.map((inv) => inv.clientId)).size
    const delinquencyRate =
      uniqueClients > 0
        ? Math.round((totalClientsAnalyzed / uniqueClients) * 100)
        : 0

    const response: DelinquencyAnalysisResponse = {
      summary: {
        totalClientsAnalyzed,
        activeClientsCount,
        inactiveClientsCount,
        delinquentClientsCount: totalClientsAnalyzed,
        totalOverdueAmount,
        averageOverdueDays,
        delinquencyRate,
      },
      byRiskLevel,
      topDelinquents,
      trends,
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisDate: new Date().toISOString().split('T')[0],
        currency: 'BRL',
      },
    }

    return ApiResponseHandler.success(response, 200, {
      count: delinquentClients.length,
      minDaysOverdue: parsedParams.minDaysOverdue,
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/reports/delinquency-analysis',
      },
    })

    if (error instanceof SyntaxError) {
      return ApiResponseHandler.validationError('Parâmetros inválidos', {
        field: 'query_params',
      })
    }

    return ApiResponseHandler.serverError()
  }
}
