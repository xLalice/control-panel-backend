/*
  Warnings:

  - The values [InProgress,Closed] on the enum `LeadStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Lead` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `data` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `leadOwnerId` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `sheetName` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the `GoogleAuth` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `assignedToId` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LeadStatus_new" AS ENUM ('New', 'Contacted', 'Qualified', 'Proposal', 'Converted', 'Lost');
ALTER TABLE "Lead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "status" TYPE "LeadStatus_new" USING ("status"::text::"LeadStatus_new");
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
DROP TYPE "LeadStatus_old";
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'New';
COMMIT;

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_leadOwnerId_fkey";

-- DropIndex
DROP INDEX "Lead_leadOwnerId_key";

-- AlterTable
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_pkey",
DROP COLUMN "data",
DROP COLUMN "leadOwnerId",
DROP COLUMN "sheetName",
ADD COLUMN     "assignedToId" TEXT NOT NULL,
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "contactHistory" JSONB,
ADD COLUMN     "dateContacted" TIMESTAMP(3),
ADD COLUMN     "dateConverted" TIMESTAMP(3),
ADD COLUMN     "dateNew" TIMESTAMP(3),
ADD COLUMN     "dateProposalSent" TIMESTAMP(3),
ADD COLUMN     "dateQualified" TIMESTAMP(3),
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "estimatedValue" DOUBLE PRECISION,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "lastContactDate" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "leadScore" DOUBLE PRECISION,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "referredBy" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "subSource" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Lead_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Lead_id_seq";

-- DropTable
DROP TABLE "GoogleAuth";

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
