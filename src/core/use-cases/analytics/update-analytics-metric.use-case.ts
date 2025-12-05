export interface IUpdateAnalyticsMetricRequest {
  id: string
  orgId: string
  name?: string
  value?: number
  previousValue?: number
  description?: string
  tags?: string[]
  updatedBy: string
}

export interface IUpdateAnalyticsMetricResponse {
  success: boolean
  data?: {
    id: string
    name: string
    value: number
    updatedAt: string
  }
  error?: string
}

import { IAnalyticsMetricRepository } from '../../ports/repositories/analytics-metric.repository.interface'

export class UpdateAnalyticsMetricUseCase {
  constructor(private repository: IAnalyticsMetricRepository) {}

  async execute(
    request: IUpdateAnalyticsMetricRequest
  ): Promise<IUpdateAnalyticsMetricResponse> {
    try {
      const metric = await this.repository.findById(request.id, request.orgId)

      if (!metric) {
        return {
          success: false,
          error: 'Métrica não encontrada',
        }
      }

      if (request.value !== undefined && request.previousValue !== undefined) {
        metric.updateValue(
          request.value,
          request.previousValue,
          request.updatedBy
        )
      }

      if (request.description !== undefined) {
        metric.updateDescription(request.description, request.updatedBy)
      }

      if (request.tags) {
        request.tags.forEach((tag) => {
          try {
            if (!metric.tags.includes(tag)) {
              metric.addTag(tag)
            }
          } catch {
            // Tag já existe, ignorar
          }
        })
      }

      const updated = await this.repository.save(metric)

      return {
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          value: updated.value,
          updatedAt: updated.updatedAt.toISOString(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro ao atualizar métrica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }
    }
  }
}
