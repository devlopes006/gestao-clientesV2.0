export interface IDeleteAnalyticsMetricRequest {
  id: string
  orgId: string
}

export interface IDeleteAnalyticsMetricResponse {
  success: boolean
  message?: string
  error?: string
}

import { IAnalyticsMetricRepository } from '../../ports/repositories/analytics-metric.repository.interface'

export class DeleteAnalyticsMetricUseCase {
  constructor(private repository: IAnalyticsMetricRepository) {}

  async execute(
    request: IDeleteAnalyticsMetricRequest
  ): Promise<IDeleteAnalyticsMetricResponse> {
    try {
      const metric = await this.repository.findById(request.id, request.orgId)

      if (!metric) {
        return {
          success: false,
          error: 'Métrica não encontrada',
        }
      }

      await this.repository.delete(request.id, request.orgId)

      return {
        success: true,
        message: 'Métrica deletada com sucesso',
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro ao deletar métrica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }
    }
  }
}
