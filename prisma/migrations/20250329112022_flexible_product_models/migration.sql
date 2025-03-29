/*
  Warnings:

  - You are about to drop the column `pricingModel` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `PageMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PostMetric` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `basePrice` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricingUnit` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `category` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('AGGREGATE', 'HEAVY_EQUIPMENT', 'STEEL');

-- CreateEnum
CREATE TYPE "PricingUnit" AS ENUM ('DAY', 'METER', 'KILOGRAM', 'TON');

-- DropForeignKey
ALTER TABLE "PostMetric" DROP CONSTRAINT "PostMetric_postId_fkey";

-- AlterTable
ALTER TABLE "Aggregate" ADD COLUMN     "weightPerUnit" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "pricingModel",
ADD COLUMN     "basePrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pricingDetails" JSONB,
ADD COLUMN     "pricingUnit" "PricingUnit" NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "Category" NOT NULL;

-- AlterTable
ALTER TABLE "Steel" ADD COLUMN     "additionalAttributes" JSONB,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "type" TEXT;

-- DropTable
DROP TABLE "PageMetric";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "PostMetric";
