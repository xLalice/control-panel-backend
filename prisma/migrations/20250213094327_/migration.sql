/*
  Warnings:

  - Added the required column `priceType` to the `Pricing` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Pricing_productId_key";

-- AlterTable
ALTER TABLE "Pricing" ADD COLUMN     "priceType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "source" TEXT;
