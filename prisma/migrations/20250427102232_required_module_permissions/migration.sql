/*
  Warnings:

  - Made the column `module` on table `Permission` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "module" SET NOT NULL;
