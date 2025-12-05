import { AdminFinancialService as DomainAdminFinancialService } from '@/domain/admin/AdminFinancialService'

export class AdminFinancialService {
  static async normalizeMonth(orgId: string, year: number, month: number) {
    return DomainAdminFinancialService.normalizeMonth(orgId, year, month)
  }
}
