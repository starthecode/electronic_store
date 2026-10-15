-- CreateEnum
CREATE TYPE "AffiliateMarketplaceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AffiliateProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "AffiliateMarketplace" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logoUrl" TEXT,
    "baseUrl" TEXT,
    "status" "AffiliateMarketplaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateMarketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProduct" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "categoryId" UUID,
    "brandId" UUID,
    "marketplaceId" UUID NOT NULL,
    "externalProductId" TEXT,
    "productUrl" TEXT,
    "affiliateUrl" TEXT NOT NULL,
    "displayPrice" DECIMAL(12,2),
    "status" "AffiliateProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateMarketplace_code_key" ON "AffiliateMarketplace"("code");

-- CreateIndex
CREATE INDEX "AffiliateMarketplace_status_idx" ON "AffiliateMarketplace"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProduct_slug_key" ON "AffiliateProduct"("slug");

-- CreateIndex
CREATE INDEX "AffiliateProduct_marketplaceId_idx" ON "AffiliateProduct"("marketplaceId");

-- CreateIndex
CREATE INDEX "AffiliateProduct_categoryId_idx" ON "AffiliateProduct"("categoryId");

-- CreateIndex
CREATE INDEX "AffiliateProduct_brandId_idx" ON "AffiliateProduct"("brandId");

-- CreateIndex
CREATE INDEX "AffiliateProduct_status_idx" ON "AffiliateProduct"("status");

-- CreateIndex
CREATE INDEX "AffiliateProduct_createdAt_idx" ON "AffiliateProduct"("createdAt");

-- AddForeignKey
ALTER TABLE "AffiliateProduct" ADD CONSTRAINT "AffiliateProduct_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "AffiliateMarketplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProduct" ADD CONSTRAINT "AffiliateProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateProduct" ADD CONSTRAINT "AffiliateProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
