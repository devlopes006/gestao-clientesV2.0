/*
  Warnings:

  - The `mainChannel` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `plan` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ClientPlan" AS ENUM ('GESTAO', 'ESTRUTURA', 'FREELANCER', 'PARCERIA', 'CONSULTORIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "SocialChannel" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'TWITTER', 'OUTRO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'LATE');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "mainChannel",
ADD COLUMN     "mainChannel" "SocialChannel",
DROP COLUMN "plan",
ADD COLUMN     "plan" "ClientPlan";
