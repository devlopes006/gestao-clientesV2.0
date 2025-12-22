import type {
  CreateCostItemInput,
  CreateSubscriptionInput,
  UpdateCostItemInput,
  UpdateSubscriptionInput,
} from '@/domain/costs/CostTrackingService'
import { CostTrackingService as DomainCostTrackingService } from '@/domain/costs/CostTrackingService'

export class CostTrackingService {
  static async createCostItem(input: CreateCostItemInput) {
    return DomainCostTrackingService.createCostItem(input)
  }

  static async updateCostItem(
    id: string,
    orgId: string,
    input: UpdateCostItemInput
  ) {
    return DomainCostTrackingService.updateCostItem(id, orgId, input)
  }

  static async deleteCostItem(id: string, orgId: string, deletedBy?: string) {
    return DomainCostTrackingService.deleteCostItem(id, orgId, deletedBy)
  }

  static async getCostItemById(id: string, orgId: string) {
    return DomainCostTrackingService.getCostItemById(id, orgId)
  }

  static async listCostItems(filters: {
    orgId: string
    active?: boolean
    category?: string
  }) {
    return DomainCostTrackingService.listCostItems(filters)
  }

  static async createSubscription(input: CreateSubscriptionInput) {
    return DomainCostTrackingService.createSubscription(input)
  }

  static async updateSubscription(
    id: string,
    orgId: string,
    input: UpdateSubscriptionInput
  ) {
    return DomainCostTrackingService.updateSubscription(id, orgId, input)
  }

  static async deleteSubscription(
    id: string,
    orgId: string,
    deletedBy?: string
  ) {
    return DomainCostTrackingService.deleteSubscription(id, orgId, deletedBy)
  }

  static async getSubscriptionById(id: string, orgId: string) {
    return DomainCostTrackingService.getSubscriptionById(id, orgId)
  }

  static async listSubscriptions(filters: {
    orgId: string
    clientId?: string
    costItemId?: string
    active?: boolean
    includeDeleted?: boolean
  }) {
    return DomainCostTrackingService.listSubscriptions(filters)
  }

  static async materializeMonthly(orgId: string, createdBy?: string) {
    return DomainCostTrackingService.materializeMonthly(orgId, createdBy)
  }

  static async calculateClientMargin(
    clientId: string,
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    return DomainCostTrackingService.calculateClientMargin(
      clientId,
      orgId,
      dateFrom,
      dateTo
    )
  }
}
