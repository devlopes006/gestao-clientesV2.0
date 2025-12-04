-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientCostSubscription" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "costItemId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,

    CONSTRAINT "ClientCostSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CostItem_orgId_active_idx" ON "CostItem"("orgId", "active");

-- CreateIndex
CREATE INDEX "ClientCostSubscription_orgId_active_idx" ON "ClientCostSubscription"("orgId", "active");

-- CreateIndex
CREATE INDEX "ClientCostSubscription_clientId_active_idx" ON "ClientCostSubscription"("clientId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ClientCostSubscription_clientId_costItemId_startDate_key" ON "ClientCostSubscription"("clientId", "costItemId", "startDate");

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCostSubscription" ADD CONSTRAINT "ClientCostSubscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCostSubscription" ADD CONSTRAINT "ClientCostSubscription_costItemId_fkey" FOREIGN KEY ("costItemId") REFERENCES "CostItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCostSubscription" ADD CONSTRAINT "ClientCostSubscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
