-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "mainChannel" TEXT,
ADD COLUMN     "plan" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new';
