/*
  Warnings:

  - A unique constraint covering the columns `[date]` on the table `PageMetric` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `PageMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `engagement` to the `PageMetric` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PageMetric" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "engagement" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PageMetric_date_key" ON "PageMetric"("date");
