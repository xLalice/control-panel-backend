/*
  Warnings:

  - Added the required column `redirectUris` to the `GoogleAuth` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GoogleAuth" ADD COLUMN     "redirectUris" TEXT NOT NULL;
