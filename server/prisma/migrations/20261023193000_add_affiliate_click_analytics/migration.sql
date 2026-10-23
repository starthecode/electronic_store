ALTER TABLE "AffiliateClick"
    ADD COLUMN "visitorHash" VARCHAR(64),
    ADD COLUMN "countryCode" VARCHAR(2),
    ADD COLUMN "region" VARCHAR(100),
    ADD COLUMN "city" VARCHAR(100),
    ADD COLUMN "referrerHost" VARCHAR(253),
    ADD COLUMN "utmSource" VARCHAR(200),
    ADD COLUMN "utmMedium" VARCHAR(200),
    ADD COLUMN "utmCampaign" VARCHAR(200),
    ADD COLUMN "utmContent" VARCHAR(200),
    ADD COLUMN "landingPath" VARCHAR(500);

CREATE INDEX "AffiliateClick_visitorHash_clickedAt_idx"
    ON "AffiliateClick"("visitorHash", "clickedAt");
CREATE INDEX "AffiliateClick_countryCode_clickedAt_idx"
    ON "AffiliateClick"("countryCode", "clickedAt");
CREATE INDEX "AffiliateClick_referrerHost_clickedAt_idx"
    ON "AffiliateClick"("referrerHost", "clickedAt");
CREATE INDEX "AffiliateClick_utmCampaign_clickedAt_idx"
    ON "AffiliateClick"("utmCampaign", "clickedAt");
