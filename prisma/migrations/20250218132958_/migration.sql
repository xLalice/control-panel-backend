-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_assignedToId_fkey";

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "assignedToId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
