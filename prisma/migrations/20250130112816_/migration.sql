/*
  Warnings:

  - The primary key for the `PageMetric` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `date` on the `PageMetric` table. All the data in the column will be lost.
  - You are about to drop the column `metric_name` on the `PageMetric` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `PageMetric` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `PageMetric` table. All the data in the column will be lost.
  - You are about to drop the column `engagementRate` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `Post` table. All the data in the column will be lost.
  - The primary key for the `PostMetric` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `consumptions` on the `PostMetric` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `PostMetric` table. All the data in the column will be lost.
  - You are about to drop the column `engagements` on the `PostMetric` table. All the data in the column will be lost.
  - You are about to drop the column `post_id` on the `PostMetric` table. All the data in the column will be lost.
  - You are about to drop the column `reactions` on the `PostMetric` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fbPostId]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `followerCount` to the `PageMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pageImpressions` to the `PageMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pageReach` to the `PageMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pageViews` to the `PageMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fbPostId` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `comments` to the `PostMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `likes` to the `PostMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postId` to the `PostMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reach` to the `PostMetric` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shares` to the `PostMetric` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PostMetric" DROP CONSTRAINT "PostMetric_post_id_fkey";

-- DropIndex
DROP INDEX "Post_platform_id_key";

-- DropIndex
DROP INDEX "PostMetric_post_id_date_key";

-- AlterTable
ALTER TABLE "PageMetric" DROP CONSTRAINT "PageMetric_pkey",
DROP COLUMN "date",
DROP COLUMN "metric_name",
DROP COLUMN "period",
DROP COLUMN "value",
ADD COLUMN     "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "followerCount" INTEGER NOT NULL,
ADD COLUMN     "pageImpressions" INTEGER NOT NULL,
ADD COLUMN     "pageReach" INTEGER NOT NULL,
ADD COLUMN     "pageViews" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "PageMetric_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "PageMetric_id_seq";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "engagementRate",
DROP COLUMN "platform",
ADD COLUMN     "fbPostId" TEXT NOT NULL,
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reach" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PostMetric" DROP CONSTRAINT "PostMetric_pkey",
DROP COLUMN "consumptions",
DROP COLUMN "date",
DROP COLUMN "engagements",
DROP COLUMN "post_id",
DROP COLUMN "reactions",
ADD COLUMN     "comments" INTEGER NOT NULL,
ADD COLUMN     "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "likes" INTEGER NOT NULL,
ADD COLUMN     "postId" TEXT NOT NULL,
ADD COLUMN     "reach" INTEGER NOT NULL,
ADD COLUMN     "shares" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "impressions" DROP DEFAULT,
ADD CONSTRAINT "PostMetric_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "PostMetric_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Post_fbPostId_key" ON "Post"("fbPostId");

-- AddForeignKey
ALTER TABLE "PostMetric" ADD CONSTRAINT "PostMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
