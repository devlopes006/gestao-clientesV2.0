-- AddPhase3PerformanceIndexes
-- This migration adds performance indexes for Phase 3 optimizations without data loss

-- Ensure Transaction table exists (backfill for older environments)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name = 'Transaction'
	) THEN
		CREATE TABLE "Transaction" (
			"id" TEXT PRIMARY KEY,
			"type" TEXT NOT NULL,
			"subtype" TEXT NOT NULL,
			"amount" DOUBLE PRECISION NOT NULL,
			"description" TEXT,
			"category" TEXT,
			"date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
			"status" TEXT NOT NULL DEFAULT 'CONFIRMED',
			"invoiceId" TEXT,
			"clientId" TEXT,
			"costItemId" TEXT,
			"metadata" JSONB,
			"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
			"createdBy" TEXT,
			"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
			"updatedBy" TEXT,
			"deletedAt" TIMESTAMP(3),
			"deletedBy" TEXT,
			"orgId" TEXT NOT NULL,
			CONSTRAINT "Transaction_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE,
			CONSTRAINT "Transaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE,
			CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
			CONSTRAINT "Transaction_costItemId_fkey" FOREIGN KEY ("costItemId") REFERENCES "CostItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
		);
		CREATE INDEX "Transaction_orgId_date_idx" ON "Transaction"("orgId", "date");
		CREATE INDEX "Transaction_orgId_type_date_idx" ON "Transaction"("orgId", "type", "date");
		CREATE INDEX "Transaction_clientId_date_idx" ON "Transaction"("clientId", "date");
		CREATE INDEX "Transaction_invoiceId_idx" ON "Transaction"("invoiceId");
		CREATE INDEX "Transaction_orgId_status_idx" ON "Transaction"("orgId", "status");
		CREATE INDEX "Transaction_deletedAt_idx" ON "Transaction"("deletedAt");
	END IF;
END$$;

-- Transaction model: Add indexes for cost tracking and subtype queries
CREATE INDEX IF NOT EXISTS "Transaction_orgId_costItemId_date_idx" ON "Transaction"("orgId", "costItemId", "date");
CREATE INDEX IF NOT EXISTS "Transaction_orgId_subtype_date_idx" ON "Transaction"("orgId", "subtype", "date");

-- Invoice model: Add composite index for overdue detection
CREATE INDEX IF NOT EXISTS "Invoice_orgId_status_dueDate_idx" ON "Invoice"("orgId", "status", "dueDate");

-- RecurringExpense model: Add composite index for active expense queries
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.tables
		WHERE table_schema = 'public' AND table_name = 'RecurringExpense'
	) THEN
		CREATE TABLE "RecurringExpense" (
			"id" TEXT PRIMARY KEY,
			"name" TEXT NOT NULL,
			"description" TEXT,
			"amount" DOUBLE PRECISION NOT NULL,
			"category" TEXT,
			"cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
			"dayOfMonth" INTEGER,
			"active" BOOLEAN NOT NULL DEFAULT true,
			"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
			"createdBy" TEXT,
			"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
			"updatedBy" TEXT,
			"deletedAt" TIMESTAMP(3),
			"deletedBy" TEXT,
			"orgId" TEXT NOT NULL,
			CONSTRAINT "RecurringExpense_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE
		);
		CREATE INDEX "RecurringExpense_orgId_active_idx" ON "RecurringExpense"("orgId", "active");
		CREATE INDEX "RecurringExpense_deletedAt_idx" ON "RecurringExpense"("deletedAt");
	END IF;
END$$;

CREATE INDEX IF NOT EXISTS "RecurringExpense_orgId_cycle_active_idx" ON "RecurringExpense"("orgId", "cycle", "active");
