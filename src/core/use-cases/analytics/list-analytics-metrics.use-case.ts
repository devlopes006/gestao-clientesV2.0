export interface IListAnalyticsMetricsRequest {
  orgId: string
  page?: number
  limit?: number
  metricType?: string
  startDate?: string
  endDate?: string
  source?: string
}

export interface IListAnalyticsMetricsResponse {
  success: boolean
  data?: {
    items: Array<{
      id: string
      name: string
      metricType: string
      value: number
      unit: string
      trend: string
      trendPercentage: number
      timeRange: string
      source: string
      createdAt: string
    }>
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error?: string
}

import { IAnalyticsMetricRepository } from '../../ports/repositories/analytics-metric.repository.interface'

export class ListAnalyticsMetricsUseCase {
  constructor(private repository: IAnalyticsMetricRepository) {}

  async execute(
    request: IListAnalyticsMetricsRequest
  ): Promise<IListAnalyticsMetricsResponse> {
    try {
      const page = request.page || 1
      const limit = request.limit || 10
      const offset = (page - 1) * limit

      const result = await this.repository.findByOrgId(request.orgId, {
        page,
        limit,
        offset,
        filters: {
          metricType: request.metricType,
          startDate: request.startDate
            ? new Date(request.startDate)
            : undefined,
          endDate: request.endDate ? new Date(request.endDate) : undefined,
          source: request.source,
        },
      })

      return {
        success: true,
        data: {
          items: result.items.map((metric) => ({
            id: metric.id,
            name: metric.name,
            metricType: metric.metricType,
            value: metric.value,
            unit: metric.unit,
            trend: metric.trend,
            trendPercentage: metric.trendPercentage,
            timeRange: metric.timeRange,
            source: metric.source,
            createdAt: metric.createdAt.toISOString(),
          })),
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro ao listar métricas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }
    }
  }
}
