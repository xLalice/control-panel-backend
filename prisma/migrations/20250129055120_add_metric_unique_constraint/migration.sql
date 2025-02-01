/*
  Warnings:

  - A unique constraint covering the columns `[postId]` on the table `Metric` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[postId,date]` on the table `Metric` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Metric" DROP CONSTRAINT "Metric_postId_fkey";

-- AlterTable
ALTER TABLE "Metric" ALTER COLUMN "impressions" DROP DEFAULT,
ALTER COLUMN "reach" DROP DEFAULT,
ALTER COLUMN "engagementRate" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Metric_postId_key" ON "Metric"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Metric_postId_date_key" ON "Metric"("postId", "date");

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
