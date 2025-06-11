/*
  Warnings:

  - You are about to drop the column `position` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `subSource` on the `Lead` table. All the data in the column will be lost.
  - You are about to alter the column `leadScore` on the `Lead` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `name` to the `Lead` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Lead` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Client_clientName_key";

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "position",
DROP COLUMN "subSource",
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "leadScore" SET DATA TYPE INTEGER;
