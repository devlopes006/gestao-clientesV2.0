import { ReportingService as DomainReportingService } from '@/domain/reports/ReportingService'

export class ReportingService {
  static async getDashboard(orgId: string, dateFrom?: Date, dateTo?: Date) {
    return DomainReportingService.getDashboard(orgId, dateFrom, dateTo)
  }

  static async auditFinancial(orgId: string, year: number, months: number[]) {
    return DomainReportingService.auditFinancial(orgId, year, months)
  }

  static async getInvoiceSummary(
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    return DomainReportingService.getInvoiceSummary(orgId, dateFrom, dateTo)
  }

  static async getOverdueInvoices(orgId: string, limit: number = 10) {
    return DomainReportingService.getOverdueInvoices(orgId, limit)
  }

  static async getTopClientsByRevenue(
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 10
  ) {
    return DomainReportingService.getTopClientsByRevenue(
      orgId,
      dateFrom,
      dateTo,
      limit
    )
  }

  static async getTopClientsByOverdue(orgId: string, limit: number = 10) {
    return DomainReportingService.getTopClientsByOverdue(orgId, limit)
  }

  static async getRecentTransactions(orgId: string, limit: number = 10) {
    return DomainReportingService.getRecentTransactions(orgId, limit)
  }

  static async getClientAnalysis(
    clientId: string,
    orgId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    return DomainReportingService.getClientAnalysis(
      clientId,
      orgId,
      dateFrom,
      dateTo
    )
  }

  static async getMonthlyReport(orgId: string, year: number, month: number) {
    return DomainReportingService.getMonthlyReport(orgId, year, month)
  }

  static async getGlobalSummary(orgId: string, year?: number) {
    return DomainReportingService.getGlobalSummary(orgId, year)
  }
}
