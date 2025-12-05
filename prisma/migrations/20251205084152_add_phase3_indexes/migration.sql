-- AddPhase3PerformanceIndexes
-- This migration adds performance indexes for Phase 3 optimizations without data loss

-- Transaction model: Add indexes for cost tracking and subtype queries
CREATE INDEX IF NOT EXISTS "Transaction_orgId_costItemId_date_idx" ON "Transaction"("orgId", "costItemId", "date");
CREATE INDEX IF NOT EXISTS "Transaction_orgId_subtype_date_idx" ON "Transaction"("orgId", "subtype", "date");

-- Invoice model: Add composite index for overdue detection
CREATE INDEX IF NOT EXISTS "Invoice_orgId_status_dueDate_idx" ON "Invoice"("orgId", "status", "dueDate");

-- RecurringExpense model: Add composite index for active expense queries
CREATE INDEX IF NOT EXISTS "RecurringExpense_orgId_cycle_active_idx" ON "RecurringExpense"("orgId", "cycle", "active");
