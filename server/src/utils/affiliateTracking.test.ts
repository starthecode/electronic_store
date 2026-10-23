import assert from "node:assert/strict";
import test from "node:test";
import {
  createVisitorCookieValue,
  displayReferralSource,
  emptyAffiliateLocation,
  getKolkataDateRange,
  hashVisitorCookie,
  makeAffiliateClickData,
  normalizeAffiliateTracking,
} from "./affiliateTracking.js";

test("visitor hashes deduplicate the same cookie without exposing its value", () => {
  const cookieValue = createVisitorCookieValue();
  const firstHash = hashVisitorCookie(cookieValue, "test-secret");
  const secondHash = hashVisitorCookie(cookieValue, "test-secret");

  assert.equal(firstHash, secondHash);
  assert.notEqual(firstHash, cookieValue);
  assert.notEqual(
    firstHash,
    hashVisitorCookie(createVisitorCookieValue(), "test-secret")
  );
});

test("missing or invalid referrers are attributed as Direct / Unknown", () => {
  const tracking = normalizeAffiliateTracking({
    referrerHost: undefined,
  });

  assert.equal(tracking.referrerHost, null);
  assert.equal(displayReferralSource(tracking.referrerHost), "Direct / Unknown");
});

test("UTM attribution is normalized and bounded", () => {
  const tracking = normalizeAffiliateTracking({
    referrerHost: "SHOP.Example",
    utmSource: " newsletter\u0000 ",
    utmMedium: "email",
    utmCampaign: "spring-sale",
    utmContent: "hero",
    landingPath: "/products/item?private=value#fragment",
  });

  assert.deepEqual(tracking, {
    referrerHost: "shop.example",
    utmSource: "newsletter",
    utmMedium: "email",
    utmCampaign: "spring-sale",
    utmContent: "hero",
    landingPath: "/products/item",
  });
  assert.equal(
    normalizeAffiliateTracking({
      utmCampaign: "x".repeat(300),
    }).utmCampaign?.length,
    200
  );
});

test("missing GeoLite2 results remain unknown", () => {
  assert.deepEqual(emptyAffiliateLocation(), {
    countryCode: null,
    region: null,
    city: null,
  });
});

test("Kolkata report dates use inclusive local dates and an exclusive end", () => {
  const range = getKolkataDateRange("2026-10-23", "2026-10-23");

  assert.equal(range.start?.toISOString(), "2026-10-22T18:30:00.000Z");
  assert.equal(
    range.endExclusive?.toISOString(),
    "2026-10-23T18:30:00.000Z"
  );
});

test("clicks retain the product's marketplace attribution", () => {
  const data = makeAffiliateClickData({
    product: {
      id: "affiliate-product-id",
      marketplaceId: "marketplace-at-click-time",
    },
    visitorHash: null,
    location: emptyAffiliateLocation(),
    tracking: normalizeAffiliateTracking({}),
  });

  assert.equal(data.affiliateProductId, "affiliate-product-id");
  assert.equal(data.marketplaceId, "marketplace-at-click-time");
  assert.equal(data.countryCode, null);
  assert.equal(data.referrerHost, null);
});
