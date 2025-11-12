/*
  Warnings:

  - A unique constraint covering the columns `[clientUserId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "clientUserId" TEXT;

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientUserId_key" ON "Client"("clientUserId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
