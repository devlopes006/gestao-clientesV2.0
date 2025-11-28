-- CreateTable
CREATE TABLE "DashboardEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "color" TEXT DEFAULT 'blue',
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardNote" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT DEFAULT 'yellow',
    "position" INTEGER NOT NULL DEFAULT 0,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardEvent_orgId_date_idx" ON "DashboardEvent"("orgId", "date");

-- CreateIndex
CREATE INDEX "DashboardNote_orgId_position_idx" ON "DashboardNote"("orgId", "position");

-- AddForeignKey
ALTER TABLE "DashboardEvent" ADD CONSTRAINT "DashboardEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardNote" ADD CONSTRAINT "DashboardNote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
