/*
  Warnings:

  - Added the required column `inquiryType` to the `Inquiry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('PricingRequest', 'ProductAvailability', 'TechnicalQuestion', 'DeliveryInquiry', 'Other');

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "inquiryType" "Category" NOT NULL,
ADD COLUMN     "priority" "Priority";

-- CreateIndex
CREATE INDEX "Inquiry_assignedToId_idx" ON "Inquiry"("assignedToId");

-- CreateIndex
CREATE INDEX "Inquiry_dueDate_idx" ON "Inquiry"("dueDate");

-- CreateIndex
CREATE INDEX "Inquiry_priority_idx" ON "Inquiry"("priority");

-- CreateIndex
CREATE INDEX "Inquiry_customerName_idx" ON "Inquiry"("customerName");

-- CreateIndex
CREATE INDEX "Inquiry_phoneNumber_idx" ON "Inquiry"("phoneNumber");

-- CreateIndex
CREATE INDEX "Inquiry_email_idx" ON "Inquiry"("email");

-- CreateIndex
CREATE INDEX "Inquiry_inquiryType_idx" ON "Inquiry"("inquiryType");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
