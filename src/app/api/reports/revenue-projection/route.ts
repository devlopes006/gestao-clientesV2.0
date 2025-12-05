import {
  aggregateClientRevenue,
  aggregateMonthlyRevenue,
  buildRevenueProjectionWhere,
  calculateProjectionAccuracy,
  revenueProjectionSchema,
  topClientsByInvoiceCount,
  topClientsByRevenue,
  type RevenueProjectionResponse,
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
    const monthsParam = searchParams.get('months')
    const fromDateParam = searchParams.get('fromDate')
    const toDateParam = searchParams.get('toDate')

    const parsedParams = revenueProjectionSchema.parse({
      months: monthsParam ? parseInt(monthsParam) : 12,
      fromDate: fromDateParam || undefined,
      toDate: toDateParam || undefined,
    })

    // Calcular datas se não fornecidas
    const now = new Date()
    const toDate = parsedParams.toDate ? new Date(parsedParams.toDate) : now
    const fromDate = parsedParams.fromDate
      ? new Date(parsedParams.fromDate)
      : new Date(now.getTime() - parsedParams.months * 30 * 24 * 60 * 60 * 1000)

    Sentry.captureMessage('Revenue Projection Request', {
      level: 'info',
      extra: {
        orgId: profile.orgId,
        months: parsedParams.months,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
    })

    // Query invoices no período
    const invoices = await prisma.invoice.findMany({
      where: buildRevenueProjectionWhere(fromDate, toDate, profile.orgId),
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    })

    if (invoices.length === 0) {
      const emptyResponse: RevenueProjectionResponse = {
        summary: {
          totalConfirmedRevenue: 0,
          totalProjectedRevenue: 0,
          totalAtRiskRevenue: 0,
          grandTotal: 0,
          averageMonthlyRevenue: 0,
          projectionAccuracy: 0,
        },
        monthlyData: [],
        clientBreakdown: [],
        topClients: {
          byRevenue: [],
          byInvoiceCount: [],
          byOverdueAmount: [],
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          monthsAnalyzed: parsedParams.months,
          totalClientsAnalyzed: 0,
          currency: 'BRL',
        },
      }

      return ApiResponseHandler.success(emptyResponse, 200, {
        message: 'Sem dados de fatura no período',
      })
    }

    // Agregar dados por mês
    const monthlyMap = aggregateMonthlyRevenue(invoices)
    const monthlyData = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    )

    // Agregar dados por cliente
    const clientMap = aggregateClientRevenue(invoices)
    const clientBreakdown = Array.from(clientMap.values())

    // Top clientes por diferentes métricas
    const topByRevenue = topClientsByRevenue(clientBreakdown, 10)
    const topByInvoiceCount = topClientsByInvoiceCount(clientBreakdown, 10)
    const topByOverdue = clientBreakdown.slice(0, 10)

    // Calcular sumário geral
    const totalConfirmedRevenue = monthlyData.reduce(
      (sum, m) => sum + m.confirmedRevenue,
      0
    )
    const totalProjectedRevenue = monthlyData.reduce(
      (sum, m) => sum + m.projectedRevenue,
      0
    )
    const totalAtRiskRevenue = monthlyData.reduce(
      (sum, m) => sum + m.atRiskRevenue,
      0
    )
    const grandTotal =
      totalConfirmedRevenue + totalProjectedRevenue + totalAtRiskRevenue
    const averageMonthlyRevenue =
      monthlyData.length > 0 ? grandTotal / monthlyData.length : 0
    const projectionAccuracy = calculateProjectionAccuracy(
      monthlyData.length,
      Math.ceil(
        (toDate.getTime() - fromDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      )
    )

    const response: RevenueProjectionResponse = {
      summary: {
        totalConfirmedRevenue,
        totalProjectedRevenue,
        totalAtRiskRevenue,
        grandTotal,
        averageMonthlyRevenue,
        projectionAccuracy,
      },
      monthlyData,
      clientBreakdown,
      topClients: {
        byRevenue: topByRevenue,
        byInvoiceCount: topByInvoiceCount,
        byOverdueAmount: topByOverdue,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        monthsAnalyzed: parsedParams.months,
        totalClientsAnalyzed: clientBreakdown.length,
        currency: 'BRL',
      },
    }

    return ApiResponseHandler.success(response, 200, {
      count: invoices.length,
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/reports/revenue-projection',
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
