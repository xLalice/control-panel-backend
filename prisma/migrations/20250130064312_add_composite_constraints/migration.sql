/*
  Warnings:

  - A unique constraint covering the columns `[post_id,date]` on the table `PostMetric` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PostMetric" ADD COLUMN     "consumptions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "engagements" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "PostMetric_post_id_date_key" ON "PostMetric"("post_id", "date");
