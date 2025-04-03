-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('Delivery', 'Pickup', 'ThirdParty');

-- CreateEnum
CREATE TYPE "ReferenceSource" AS ENUM ('Facebook', 'Instagram', 'TikTok', 'Referral', 'Flyers', 'Other');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "productType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "deliveryLocation" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "referenceSource" "ReferenceSource" NOT NULL,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inquiry_createdById_idx" ON "Inquiry"("createdById");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
