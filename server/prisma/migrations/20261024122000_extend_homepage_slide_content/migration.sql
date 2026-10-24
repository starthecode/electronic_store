ALTER TABLE "HomepageSlide"
    ADD COLUMN "brandName" TEXT,
    ADD COLUMN "titleHighlight" TEXT,
    ADD COLUMN "featureBullets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "specText" TEXT,
    ADD COLUMN "priceLabel" TEXT,
    ADD COLUMN "price" TEXT,
    ADD COLUMN "variantLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "backgroundImageUrl" TEXT,
    ADD COLUMN "backgroundColor" TEXT;
