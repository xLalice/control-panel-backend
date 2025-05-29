/*
  Warnings:

  - You are about to drop the column `customerId` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `ContactHistory` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `Inquiry` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `SalesOrder` table. All the data in the column will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `clientName` to the `Inquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `SalesOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('Active', 'Inactive', 'OnHold');

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_customerId_fkey";

-- DropForeignKey
ALTER TABLE "ContactHistory" DROP CONSTRAINT "ContactHistory_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_convertedFromLeadId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropForeignKey
ALTER TABLE "SalesOrder" DROP CONSTRAINT "SalesOrder_customerId_fkey";

-- DropIndex
DROP INDEX "ActivityLog_customerId_idx";

-- DropIndex
DROP INDEX "ContactHistory_customerId_idx";

-- DropIndex
DROP INDEX "Inquiry_customerName_idx";

-- DropIndex
DROP INDEX "Invoice_customerId_idx";

-- DropIndex
DROP INDEX "SalesOrder_customerId_idx";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "customerId",
ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "ContactHistory" DROP COLUMN "customerId",
ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "Inquiry" DROP COLUMN "customerName",
ADD COLUMN     "clientName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "customerId",
ADD COLUMN     "clientId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SalesOrder" DROP COLUMN "customerId",
ADD COLUMN     "clientId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Customer";

-- DropEnum
DROP TYPE "CustomerStatus";

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "clientName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "primaryEmail" TEXT,
    "primaryPhone" TEXT,
    "billingAddressStreet" TEXT,
    "billingAddressCity" TEXT,
    "billingAddressRegion" TEXT,
    "billingAddressPostalCode" TEXT,
    "billingAddressCountry" TEXT,
    "shippingAddressStreet" TEXT,
    "shippingAddressCity" TEXT,
    "shippingAddressRegion" TEXT,
    "shippingAddressPostalCode" TEXT,
    "shippingAddressCountry" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "convertedFromLeadId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientName_key" ON "Client"("clientName");

-- CreateIndex
CREATE UNIQUE INDEX "Client_accountNumber_key" ON "Client"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Client_convertedFromLeadId_key" ON "Client"("convertedFromLeadId");

-- CreateIndex
CREATE INDEX "Client_clientName_idx" ON "Client"("clientName");

-- CreateIndex
CREATE INDEX "Client_companyId_idx" ON "Client"("companyId");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_isActive_idx" ON "Client"("isActive");

-- CreateIndex
CREATE INDEX "Client_primaryEmail_idx" ON "Client"("primaryEmail");

-- CreateIndex
CREATE INDEX "Client_primaryPhone_idx" ON "Client"("primaryPhone");

-- CreateIndex
CREATE INDEX "ActivityLog_clientId_idx" ON "ActivityLog"("clientId");

-- CreateIndex
CREATE INDEX "ContactHistory_clientId_idx" ON "ContactHistory"("clientId");

-- CreateIndex
CREATE INDEX "Inquiry_clientName_idx" ON "Inquiry"("clientName");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "SalesOrder_clientId_idx" ON "SalesOrder"("clientId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_convertedFromLeadId_fkey" FOREIGN KEY ("convertedFromLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactHistory" ADD CONSTRAINT "ContactHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
