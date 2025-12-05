export interface ICreateAnalyticsMetricRequest {
  orgId: string
  name: string
  metricType: string
  value: number
  unit: string
  trend: 'UP' | 'DOWN' | 'STABLE'
  trendPercentage: number
  timeRange: string
  startDate: string
  endDate: string
  source: string
  tags?: string[]
  description?: string
  createdBy: string
}

export interface ICreateAnalyticsMetricResponse {
  success: boolean
  data?: {
    id: string
    name: string
    metricType: string
    value: number
  }
  error?: string
}

import { AnalyticsMetric } from '../../domain/analytics/entities/analytics-metric.entity'
import {
  MetricType,
  TimeRangeType,
  isValidMetricType,
  isValidTimeRangeType,
} from '../../domain/analytics/value-objects/analytics-metric.vo'
import { IAnalyticsMetricRepository } from '../../ports/repositories/analytics-metric.repository.interface'

export class CreateAnalyticsMetricUseCase {
  constructor(private repository: IAnalyticsMetricRepository) {}

  async execute(
    request: ICreateAnalyticsMetricRequest
  ): Promise<ICreateAnalyticsMetricResponse> {
    try {
      if (!isValidMetricType(request.metricType)) {
        return {
          success: false,
          error: 'Tipo de métrica inválido',
        }
      }

      if (!isValidTimeRangeType(request.timeRange)) {
        return {
          success: false,
          error: 'Período de tempo inválido',
        }
      }

      const metric = AnalyticsMetric.create({
        orgId: request.orgId,
        name: request.name,
        metricType: request.metricType as MetricType,
        value: request.value,
        unit: request.unit,
        trend: request.trend,
        trendPercentage: request.trendPercentage,
        timeRange: request.timeRange as TimeRangeType,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        source: request.source,
        tags: request.tags,
        description: request.description,
        createdBy: request.createdBy,
        updatedBy: request.createdBy,
      })

      const saved = await this.repository.save(metric)

      return {
        success: true,
        data: {
          id: saved.id,
          name: saved.name,
          metricType: saved.metricType,
          value: saved.value,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro ao criar métrica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }
    }
  }
}
