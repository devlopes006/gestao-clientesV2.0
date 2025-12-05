import { FinancialAutomationService as DomainFinancialAutomationService } from '@/domain/automation/FinancialAutomationService'

export class FinancialAutomationService {
  static async generateSmartMonthlyInvoices(orgId: string, createdBy?: string) {
    return DomainFinancialAutomationService.generateSmartMonthlyInvoices(orgId, createdBy)
  }

  // Keep any other public API surface delegating to domain if present
}

export namespace FinancialAutomationService {
  export async function updateOverdueInvoices(orgId: string) {
    return DomainFinancialAutomationService.updateOverdueInvoices(orgId)
  }

  export async function syncClientFinancialData(clientId: string, orgId: string) {
    return DomainFinancialAutomationService.syncClientFinancialData(clientId, orgId)
  }

  export async function calculateProjection(orgId: string, months: number = 3) {
    return DomainFinancialAutomationService.calculateProjection(orgId, months)
  }
}

