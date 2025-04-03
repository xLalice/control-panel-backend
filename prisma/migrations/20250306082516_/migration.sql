/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryPrice` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `minStock` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `pickupPrice` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `stockLevel` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Aggregate` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Steel` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Steel` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Steel` table. All the data in the column will be lost.
  - You are about to drop the column `stockLevel` on the `Steel` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Steel` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Steel` table. All the data in the column will be lost.
  - The `grade` column on the `Steel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AggregatePriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AngleBar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AngleBarPriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChannelBar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChannelBarPriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Equipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EquipmentPriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GICPurlin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GICPurlinPriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GISheet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GISheetPriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GITubular` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GITubularPriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MSPlate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MSPlatePriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SteelPriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productId]` on the table `Aggregate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Lead` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId]` on the table `Steel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `ActivityLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `Aggregate` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `source` on the `Aggregate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `createdById` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `Steel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LeadStatus" ADD VALUE 'Negotiation';
ALTER TYPE "LeadStatus" ADD VALUE 'FollowUp';

-- DropForeignKey
ALTER TABLE "AggregatePriceHistory" DROP CONSTRAINT "AggregatePriceHistory_aggregateId_fkey";

-- DropForeignKey
ALTER TABLE "AngleBarPriceHistory" DROP CONSTRAINT "AngleBarPriceHistory_angleBarId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelBarPriceHistory" DROP CONSTRAINT "ChannelBarPriceHistory_channelBarId_fkey";

-- DropForeignKey
ALTER TABLE "EquipmentPriceHistory" DROP CONSTRAINT "EquipmentPriceHistory_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "GICPurlinPriceHistory" DROP CONSTRAINT "GICPurlinPriceHistory_giCPurlinId_fkey";

-- DropForeignKey
ALTER TABLE "GISheetPriceHistory" DROP CONSTRAINT "GISheetPriceHistory_giSheetId_fkey";

-- DropForeignKey
ALTER TABLE "GITubularPriceHistory" DROP CONSTRAINT "GITubularPriceHistory_giTubularId_fkey";

-- DropForeignKey
ALTER TABLE "MSPlatePriceHistory" DROP CONSTRAINT "MSPlatePriceHistory_msPlateId_fkey";

-- DropForeignKey
ALTER TABLE "SteelPriceHistory" DROP CONSTRAINT "SteelPriceHistory_steelId_fkey";

-- DropIndex
DROP INDEX "Steel_size_grade_key";

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Aggregate" DROP COLUMN "createdAt",
DROP COLUMN "deliveryPrice",
DROP COLUMN "minStock",
DROP COLUMN "name",
DROP COLUMN "pickupPrice",
DROP COLUMN "stockLevel",
DROP COLUMN "type",
DROP COLUMN "unit",
DROP COLUMN "updatedAt",
ADD COLUMN     "productId" TEXT NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Steel" DROP COLUMN "createdAt",
DROP COLUMN "price",
DROP COLUMN "size",
DROP COLUMN "stockLevel",
DROP COLUMN "unit",
DROP COLUMN "updatedAt",
ADD COLUMN     "productId" TEXT NOT NULL,
DROP COLUMN "grade",
ADD COLUMN     "grade" TEXT,
ALTER COLUMN "length" DROP NOT NULL,
ALTER COLUMN "length" DROP DEFAULT,
ALTER COLUMN "length" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "AggregatePriceHistory";

-- DropTable
DROP TABLE "AngleBar";

-- DropTable
DROP TABLE "AngleBarPriceHistory";

-- DropTable
DROP TABLE "ChannelBar";

-- DropTable
DROP TABLE "ChannelBarPriceHistory";

-- DropTable
DROP TABLE "Equipment";

-- DropTable
DROP TABLE "EquipmentPriceHistory";

-- DropTable
DROP TABLE "GICPurlin";

-- DropTable
DROP TABLE "GICPurlinPriceHistory";

-- DropTable
DROP TABLE "GISheet";

-- DropTable
DROP TABLE "GISheetPriceHistory";

-- DropTable
DROP TABLE "GITubular";

-- DropTable
DROP TABLE "GITubularPriceHistory";

-- DropTable
DROP TABLE "MSPlate";

-- DropTable
DROP TABLE "MSPlatePriceHistory";

-- DropTable
DROP TABLE "SteelPriceHistory";

-- DropEnum
DROP TYPE "EquipmentStatus";

-- DropEnum
DROP TYPE "Grade";

-- DropEnum
DROP TYPE "Source";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricingModel" TEXT NOT NULL,
    "unit" TEXT,
    "pickUpPrice" DOUBLE PRECISION,
    "deliveryPrice" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeavyEquipment" (
    "id" TEXT NOT NULL,
    "equipmentType" TEXT,
    "productId" TEXT NOT NULL,

    CONSTRAINT "HeavyEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeavyEquipment_productId_key" ON "HeavyEquipment"("productId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdById_idx" ON "ActivityLog"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Aggregate_productId_key" ON "Aggregate"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_phone_key" ON "Company"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_phone_key" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_createdById_idx" ON "Lead"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Steel_productId_key" ON "Steel"("productId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aggregate" ADD CONSTRAINT "Aggregate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeavyEquipment" ADD CONSTRAINT "HeavyEquipment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Steel" ADD CONSTRAINT "Steel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
