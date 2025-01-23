/*
  Warnings:

  - A unique constraint covering the columns `[leadOwnerId]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('New', 'InProgress', 'Converted');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "leadOwnerId" TEXT,
ADD COLUMN     "status" "LeadStatus" NOT NULL DEFAULT 'New';

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadOwnerId_key" ON "Lead"("leadOwnerId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_leadOwnerId_fkey" FOREIGN KEY ("leadOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
