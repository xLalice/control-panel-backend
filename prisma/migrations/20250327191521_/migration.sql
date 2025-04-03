-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'READ_POSTS';
ALTER TYPE "Permission" ADD VALUE 'WRITE_POSTS';
ALTER TYPE "Permission" ADD VALUE 'READ_REPORTS';
ALTER TYPE "Permission" ADD VALUE 'UPDATE_LEAD_STATUS';
ALTER TYPE "Permission" ADD VALUE 'READ_DELIVERY_INFO';
ALTER TYPE "Permission" ADD VALUE 'READ_INVOICES';
