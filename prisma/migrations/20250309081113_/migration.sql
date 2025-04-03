/*
  Warnings:

  - The `status` column on the `Inquiry` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('New', 'Quoted', 'Approved', 'Scheduled', 'Fulfilled', 'Cancelled');

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "quotedAt" TIMESTAMP(3),
ADD COLUMN     "quotedBy" TEXT,
ADD COLUMN     "quotedPrice" DOUBLE PRECISION,
ADD COLUMN     "relatedLeadId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "InquiryStatus" NOT NULL DEFAULT 'New';

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_relatedLeadId_idx" ON "Inquiry"("relatedLeadId");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_relatedLeadId_fkey" FOREIGN KEY ("relatedLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
