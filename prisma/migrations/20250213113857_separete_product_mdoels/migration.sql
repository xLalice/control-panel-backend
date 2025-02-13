/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PriceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pricing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('Available', 'InUse', 'Maintenance', 'Repairs');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('Batangas', 'Montalban');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('Grade33', 'Grade40', 'Grade60');

-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_productId_fkey";

-- DropForeignKey
ALTER TABLE "Pricing" DROP CONSTRAINT "Pricing_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "PriceHistory";

-- DropTable
DROP TABLE "Pricing";

-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'Available',
    "hourlyRate" DECIMAL(65,30) NOT NULL,
    "dailyRate" DECIMAL(65,30) NOT NULL,
    "weeklyRate" DECIMAL(65,30),
    "imageUrl" TEXT,
    "maintenanceSchedule" TIMESTAMP(3),
    "lastMaintenance" TIMESTAMP(3),
    "purchaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentPriceHistory" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "oldHourlyRate" DECIMAL(65,30) NOT NULL,
    "newHourlyRate" DECIMAL(65,30) NOT NULL,
    "oldDailyRate" DECIMAL(65,30) NOT NULL,
    "newDailyRate" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aggregate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "pickupPrice" DECIMAL(65,30) NOT NULL,
    "deliveryPrice" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "stockLevel" INTEGER,
    "minStock" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregatePriceHistory" (
    "id" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "oldPickupPrice" DECIMAL(65,30) NOT NULL,
    "newPickupPrice" DECIMAL(65,30) NOT NULL,
    "oldDeliveryPrice" DECIMAL(65,30) NOT NULL,
    "newDeliveryPrice" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AggregatePriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Steel" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "length" DOUBLE PRECISION NOT NULL DEFAULT 6,
    "price" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'length',
    "stockLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Steel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SteelPriceHistory" (
    "id" TEXT NOT NULL,
    "steelId" TEXT NOT NULL,
    "oldPrice" DECIMAL(65,30) NOT NULL,
    "newPrice" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SteelPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Steel_size_grade_key" ON "Steel"("size", "grade");

-- AddForeignKey
ALTER TABLE "EquipmentPriceHistory" ADD CONSTRAINT "EquipmentPriceHistory_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregatePriceHistory" ADD CONSTRAINT "AggregatePriceHistory_aggregateId_fkey" FOREIGN KEY ("aggregateId") REFERENCES "Aggregate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SteelPriceHistory" ADD CONSTRAINT "SteelPriceHistory_steelId_fkey" FOREIGN KEY ("steelId") REFERENCES "Steel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
