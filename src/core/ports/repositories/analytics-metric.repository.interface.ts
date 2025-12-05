import { AnalyticsMetric } from '../../domain/analytics/entities/analytics-metric.entity'

export interface IAnalyticsMetricRepository {
  save(metric: AnalyticsMetric): Promise<AnalyticsMetric>
  findById(id: string, orgId: string): Promise<AnalyticsMetric | null>
  findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      offset?: number
      filters?: {
        metricType?: string
        startDate?: Date
        endDate?: Date
        source?: string
      }
    }
  ): Promise<{ items: AnalyticsMetric[]; total: number }>
  findByMetricType(
    orgId: string,
    metricType: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ items: AnalyticsMetric[]; total: number }>
  findByDateRange(
    orgId: string,
    startDate: Date,
    endDate: Date,
    options?: { page?: number; limit?: number }
  ): Promise<{ items: AnalyticsMetric[]; total: number }>
  findBySource(
    orgId: string,
    source: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ items: AnalyticsMetric[]; total: number }>
  exists(id: string, orgId: string): Promise<boolean>
  delete(id: string, orgId: string): Promise<void>
}
