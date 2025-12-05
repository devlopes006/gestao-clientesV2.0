import { AdminReconcileService as DomainAdminReconcileService } from '@/domain/admin/AdminReconcileService'

export class AdminReconcileService {
  static async reconcileMonth(
    orgId: string,
    year: number,
    month: number,
    targetIncome: number | null,
    targetExpense: number | null
  ) {
    return DomainAdminReconcileService.reconcileMonth(
      orgId,
      year,
      month,
      targetIncome,
      targetExpense
    )
  }
}

export default AdminReconcileService
