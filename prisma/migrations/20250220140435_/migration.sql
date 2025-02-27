/*
  Warnings:

  - You are about to drop the column `contactHistory` on the `Lead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "contactHistory";

-- CreateTable
CREATE TABLE "ContactHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "outcome" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactHistory_leadId_idx" ON "ContactHistory"("leadId");

-- CreateIndex
CREATE INDEX "ContactHistory_timestamp_idx" ON "ContactHistory"("timestamp");

-- AddForeignKey
ALTER TABLE "ContactHistory" ADD CONSTRAINT "ContactHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
