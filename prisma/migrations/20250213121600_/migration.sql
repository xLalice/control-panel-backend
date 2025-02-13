-- CreateTable
CREATE TABLE "AngleBar" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "thickness" DECIMAL(65,30) NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "color" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AngleBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelBar" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "type" TEXT,
    "weight" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelBar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GICPurlin" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "thickness" DECIMAL(65,30) NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GICPurlin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GISheet" (
    "id" TEXT NOT NULL,
    "gauge" TEXT NOT NULL,
    "thickness" DECIMAL(65,30) NOT NULL,
    "dimensions" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GISheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GITubular" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "thickness" DECIMAL(65,30) NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GITubular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MSPlate" (
    "id" TEXT NOT NULL,
    "thickness" DECIMAL(65,30) NOT NULL,
    "dimensions" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MSPlate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AngleBarPriceHistory" (
    "id" TEXT NOT NULL,
    "angleBarId" TEXT NOT NULL,
    "oldPrice" DECIMAL(65,30) NOT NULL,
    "newPrice" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AngleBarPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelBarPriceHistory" (
    "id" TEXT NOT NULL,
    "channelBarId" TEXT NOT NULL,
    "oldPrice" DECIMAL(65,30) NOT NULL,
    "newPrice" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelBarPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GICPurlinPriceHistory" (
    "id" TEXT NOT NULL,
    "giCPurlinId" TEXT NOT NULL,
    "oldPrice" DECIMAL(65,30) NOT NULL,
    "newPrice" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GICPurlinPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GISheetPriceHistory" (
    "id" TEXT NOT NULL,
    "giSheetId" TEXT NOT NULL,
    "oldPrice" DECIMAL(65,30) NOT NULL,
    "newPrice" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GISheetPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GITubularPriceHistory" (
    "id" TEXT NOT NULL,
    "giTubularId" TEXT NOT NULL,
    "oldPrice" DECIMAL(65,30) NOT NULL,
    "newPrice" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GITubularPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MSPlatePriceHistory" (
    "id" TEXT NOT NULL,
    "msPlateId" TEXT NOT NULL,
    "oldPrice" DECIMAL(65,30) NOT NULL,
    "newPrice" DECIMAL(65,30) NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MSPlatePriceHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AngleBarPriceHistory" ADD CONSTRAINT "AngleBarPriceHistory_angleBarId_fkey" FOREIGN KEY ("angleBarId") REFERENCES "AngleBar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelBarPriceHistory" ADD CONSTRAINT "ChannelBarPriceHistory_channelBarId_fkey" FOREIGN KEY ("channelBarId") REFERENCES "ChannelBar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GICPurlinPriceHistory" ADD CONSTRAINT "GICPurlinPriceHistory_giCPurlinId_fkey" FOREIGN KEY ("giCPurlinId") REFERENCES "GICPurlin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GISheetPriceHistory" ADD CONSTRAINT "GISheetPriceHistory_giSheetId_fkey" FOREIGN KEY ("giSheetId") REFERENCES "GISheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GITubularPriceHistory" ADD CONSTRAINT "GITubularPriceHistory_giTubularId_fkey" FOREIGN KEY ("giTubularId") REFERENCES "GITubular"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MSPlatePriceHistory" ADD CONSTRAINT "MSPlatePriceHistory_msPlateId_fkey" FOREIGN KEY ("msPlateId") REFERENCES "MSPlate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
