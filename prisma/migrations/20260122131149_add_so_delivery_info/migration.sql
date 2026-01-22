/*
  Warnings:

  - Added the required column `deliveryDate` to the `SalesOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentTerms` to the `SalesOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentTerms" TEXT NOT NULL;
