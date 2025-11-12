-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "contractEnd" TIMESTAMP(3),
ADD COLUMN     "contractStart" TIMESTAMP(3),
ADD COLUMN     "contractValue" DOUBLE PRECISION,
ADD COLUMN     "paymentDay" INTEGER;
