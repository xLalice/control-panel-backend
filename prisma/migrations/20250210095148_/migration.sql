-- CreateTable
CREATE TABLE "FacebookCreds" (
    "id" SERIAL NOT NULL,
    "user_access_token" TEXT NOT NULL,
    "page_access_token" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacebookCreds_pkey" PRIMARY KEY ("id")
);
