/*
  Warnings:

  - You are about to alter the column `pickUpPrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `deliveryPrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `basePrice` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sku` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sku" TEXT NOT NULL,
ALTER COLUMN "pickUpPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "deliveryPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "basePrice" SET DATA TYPE DECIMAL(65,30);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
