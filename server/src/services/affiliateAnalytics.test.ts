import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/test";
process.env.JWT_SECRET ??= "test-visitor-hash-secret";
delete process.env.GEOLITE2_CITY_DB_PATH;

const { prisma } = await import("../config/database.js");
const { recordAffiliateClick } = await import("./affiliateClick.service.js");
const {
  getAffiliateOverview,
  getAffiliateMarketplaceReport,
  getAffiliateTrendReport,
} = await import("./affiliateReport.service.js");

const database = prisma as unknown as {
  affiliateProduct: {
    findUnique: (...args: unknown[]) => Promise<unknown>;
    count: (...args: unknown[]) => Promise<number>;
  };
  affiliateMarketplace: {
    count: (...args: unknown[]) => Promise<number>;
  };
  affiliateClick: {
    create: (...args: unknown[]) => Promise<unknown>;
  };
  $queryRaw: (query: { sql: string; values: unknown[] }) => Promise<unknown[]>;
};

test("consented redirect stores the clicked product and marketplace with no raw IP", async () => {
  const originalFindUnique = database.affiliateProduct.findUnique;
  const originalCreate = database.affiliateClick.create;
  const originalGeoPath = process.env.GEOLITE2_CITY_DB_PATH;
  let storedData: Record<string, unknown> | undefined;

  database.affiliateProduct.findUnique = async () => ({
    id: "product-id",
    marketplaceId: "marketplace-id-at-click",
    affiliateUrl: "https://retailer.example/item",
    status: "ACTIVE",
  });
  database.affiliateClick.create = async (args: unknown) => {
    storedData = (args as { data: Record<string, unknown> }).data;
    return {};
  };
  delete process.env.GEOLITE2_CITY_DB_PATH;

  try {
    await recordAffiliateClick("product-id", {
      consented: true,
      visitorCookieValue: "a".repeat(43),
      ip: "203.0.113.10",
      tracking: {
        referrerHost: "publisher.example",
        utmSource: "newsletter",
        landingPath: "/products/item",
      },
    });

    assert.equal(storedData?.affiliateProductId, "product-id");
    assert.equal(storedData?.marketplaceId, "marketplace-id-at-click");
    assert.equal(storedData?.referrerHost, "publisher.example");
    assert.equal(storedData?.utmSource, "newsletter");
    assert.equal(storedData?.landingPath, "/products/item");
    assert.equal(typeof storedData?.visitorHash, "string");
    assert.equal(storedData?.ipHash, undefined);
    assert.equal(storedData?.userAgent, undefined);
    assert.equal(storedData?.referrer, undefined);
    assert.equal(storedData?.countryCode, null);
  } finally {
    database.affiliateProduct.findUnique = originalFindUnique;
    database.affiliateClick.create = originalCreate;
    if (originalGeoPath === undefined) {
      delete process.env.GEOLITE2_CITY_DB_PATH;
    } else {
      process.env.GEOLITE2_CITY_DB_PATH = originalGeoPath;
    }
  }
});

test("overview counts consented visitor hashes separately from legacy IP hashes", async () => {
  const originalQueryRaw = database.$queryRaw;
  const originalProductCount = database.affiliateProduct.count;
  const originalMarketplaceCount = database.affiliateMarketplace.count;
  let sql = "";
  let values: unknown[] = [];

  database.$queryRaw = async (query) => {
    sql = query.sql;
    values = query.values;
    return [{
      totalClicks: 5n,
      uniqueVisitors: 2n,
      legacyUniqueClicks: 3n,
      countries: 1n,
      regions: 2n,
      referralSources: 1n,
      campaigns: 1n,
    }];
  };
  database.affiliateProduct.count = async () => 1;
  database.affiliateMarketplace.count = async () => 2;

  try {
    const result = await getAffiliateOverview({
      from: "2026-10-23",
      to: "2026-10-23",
    });

    assert.equal(result.uniqueVisitors, 2);
    assert.equal(result.legacyUniqueClicks, 3);
    assert.match(sql, /COUNT\(DISTINCT ac\."visitorHash"\)/);
    assert.match(sql, /WHERE ac\."visitorHash" IS NULL/);
    assert.match(sql, /AT TIME ZONE 'UTC'/);
    assert.equal(values[0] instanceof Date, true);
    assert.equal(
      (values[0] as Date).toISOString(),
      "2026-10-22T18:30:00.000Z"
    );
  } finally {
    database.$queryRaw = originalQueryRaw;
    database.affiliateProduct.count = originalProductCount;
    database.affiliateMarketplace.count = originalMarketplaceCount;
  }
});

test("daily trend query counts visitors per Asia/Kolkata day", async () => {
  const originalQueryRaw = database.$queryRaw;
  let sql = "";

  database.$queryRaw = async (query) => {
    sql = query.sql;
    return [{
      date: "2026-10-23",
      clicks: 4n,
      uniqueVisitors: 2n,
      legacyUniqueClicks: 1n,
    }];
  };

  try {
    const result = await getAffiliateTrendReport({
      from: "2026-10-23",
      to: "2026-10-23",
    });
    assert.equal(result.trends[0].date, "2026-10-23");
    assert.equal(result.trends[0].clicks, 4);
    assert.equal(result.trends[0].uniqueVisitors, 2);
    assert.match(sql, /AT TIME ZONE 'Asia\/Kolkata'/);
    assert.match(sql, /COUNT\(DISTINCT ac\."visitorHash"\)/);
  } finally {
    database.$queryRaw = originalQueryRaw;
  }
});

test("marketplace aggregation uses marketplace recorded on each click", async () => {
  const originalQueryRaw = database.$queryRaw;
  let sql = "";
  let values: unknown[] = [];

  database.$queryRaw = async (query) => {
    sql = query.sql;
    values = query.values;
    return [];
  };

  try {
    await getAffiliateMarketplaceReport({
      from: "2026-10-23",
      to: "2026-10-23",
    });

    assert.match(sql, /ac\."marketplaceId" = am\."id"/);
    assert.match(sql, /COUNT\(DISTINCT ac\."visitorHash"\)/);
    assert.match(sql, /AT TIME ZONE 'UTC'/);
    assert.equal(values.length, 6);
  } finally {
    database.$queryRaw = originalQueryRaw;
  }
});
