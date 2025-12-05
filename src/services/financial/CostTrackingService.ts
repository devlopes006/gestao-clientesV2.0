import { CostTrackingService as DomainCostTrackingService } from '@/domain/costs/CostTrackingService'

export class CostTrackingService {
  static async createCostItem(input: any) {
    return DomainCostTrackingService.createCostItem(input)
  }

  static async updateCostItem(id: string, orgId: string, input: any) {
    return DomainCostTrackingService.updateCostItem(id, orgId, input)
  }

  static async deleteCostItem(id: string, orgId: string, deletedBy?: string) {
    return DomainCostTrackingService.deleteCostItem(id, orgId, deletedBy)
  }

  static async getCostItemById(id: string, orgId: string) {
    return DomainCostTrackingService.getCostItemById(id, orgId)
  }

  static async listCostItems(filters: any) {
    return DomainCostTrackingService.listCostItems(filters)
  }

  static async createSubscription(input: any) {
    return DomainCostTrackingService.createSubscription(input)
  }

  static async updateSubscription(id: string, orgId: string, input: any) {
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

  static async listSubscriptions(filters: any) {
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
