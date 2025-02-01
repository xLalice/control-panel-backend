/*
  Warnings:

  - You are about to drop the `Metric` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Metric" DROP CONSTRAINT "Metric_postId_fkey";

-- DropTable
DROP TABLE "Metric";

-- CreateTable
CREATE TABLE "PageMetric" (
    "id" SERIAL NOT NULL,
    "metric_name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMetric" (
    "id" SERIAL NOT NULL,
    "post_id" TEXT NOT NULL,
    "reactions" JSONB NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostMetric_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PostMetric" ADD CONSTRAINT "PostMetric_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
