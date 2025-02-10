/*
  Warnings:

  - A unique constraint covering the columns `[user_access_token]` on the table `FacebookCreds` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FacebookCreds_user_access_token_key" ON "FacebookCreds"("user_access_token");
