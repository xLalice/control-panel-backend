/*
  Warnings:

  - You are about to drop the column `company` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `dateContacted` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `dateConverted` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `dateNew` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `dateProposalSent` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `dateQualified` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Lead` table. All the data in the column will be lost.
  - Added the required column `companyName` to the `Lead` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "company",
DROP COLUMN "dateContacted",
DROP COLUMN "dateConverted",
DROP COLUMN "dateNew",
DROP COLUMN "dateProposalSent",
DROP COLUMN "dateQualified",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "companyName" TEXT NOT NULL,
ADD COLUMN     "contactPerson" TEXT,
ALTER COLUMN "email" DROP NOT NULL;
