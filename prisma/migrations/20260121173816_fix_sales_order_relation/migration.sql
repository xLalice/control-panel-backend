/*
  Warnings:

  - A unique constraint covering the columns `[quoteReferenceId]` on the table `SalesOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('Pending', 'Processing', 'ReadyForPickup', 'OutForDelivery', 'Completed', 'Cancelled');

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "quoteReferenceId" TEXT,
ADD COLUMN     "status" "SalesOrderStatus" NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "_ProductToSalesOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToSalesOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProductToSalesOrder_B_index" ON "_ProductToSalesOrder"("B");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_quoteReferenceId_key" ON "SalesOrder"("quoteReferenceId");

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quoteReferenceId_fkey" FOREIGN KEY ("quoteReferenceId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToSalesOrder" ADD CONSTRAINT "_ProductToSalesOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToSalesOrder" ADD CONSTRAINT "_ProductToSalesOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
