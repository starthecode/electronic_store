-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" UUID NOT NULL,
    "affiliateProductId" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateClick_affiliateProductId_idx" ON "AffiliateClick"("affiliateProductId");

-- CreateIndex
CREATE INDEX "AffiliateClick_marketplaceId_idx" ON "AffiliateClick"("marketplaceId");

-- CreateIndex
CREATE INDEX "AffiliateClick_clickedAt_idx" ON "AffiliateClick"("clickedAt");

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_affiliateProductId_fkey" FOREIGN KEY ("affiliateProductId") REFERENCES "AffiliateProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "AffiliateMarketplace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
