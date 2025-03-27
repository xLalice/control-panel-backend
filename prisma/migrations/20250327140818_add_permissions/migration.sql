/*
  Warnings:

  - You are about to drop the column `department` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `FacebookCreds` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('READ_ALL', 'WRITE_ALL', 'DELETE_ALL', 'MANAGE_USERS', 'MANAGE_SYSTEM_SETTINGS', 'MANAGE_DOCUMENT_CATEGORIES', 'WRITE_DOCUMENTS', 'READ_DOCUMENTS', 'DELETE_DOCUMENTS', 'READ_INQUIRIES', 'WRITE_INQUIRIES', 'UPDATE_INQUIRIES', 'DELETE_INQUIRIES', 'READ_LEADS', 'WRITE_LEADS', 'UPDATE_LEADS', 'DELETE_LEADS', 'READ_PRODUCTS', 'WRITE_PRODUCTS', 'UPDATE_PRODUCTS', 'DELETE_PRODUCTS');

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "department";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "roleId" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "FacebookCreds";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "Permission"[],

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
