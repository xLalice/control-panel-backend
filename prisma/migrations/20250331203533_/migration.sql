/*
  Warnings:

  - Changed the type of `inquiryType` on the `Inquiry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Inquiry" DROP COLUMN "inquiryType",
ADD COLUMN     "inquiryType" "InquiryType" NOT NULL;

-- CreateIndex
CREATE INDEX "Inquiry_inquiryType_idx" ON "Inquiry"("inquiryType");
