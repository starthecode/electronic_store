import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  displayReferralSource,
  getKolkataDateRange,
} from "../utils/affiliateTracking.js";

const getDateRange = (
  from?: string,
  to?: string
) => getKolkataDateRange(from, to);

/**
 * Build SQL conditions for affiliate clicks date filtering.
 */
const getClickDateConditions = (
  from?: string,
  to?: string
): Prisma.Sql[] => {
  const { start, endExclusive } = getDateRange(from, to);

  const conditions: Prisma.Sql[] = [];

  if (start) {
    conditions.push(
      Prisma.sql`(ac."clickedAt" AT TIME ZONE 'UTC') >= ${start}`
    );
  }

  if (endExclusive) {
    conditions.push(
      Prisma.sql`(ac."clickedAt" AT TIME ZONE 'UTC') < ${endExclusive}`
    );
  }

  return conditions;
};

const getPeriod = (
  from?: string,
  to?: string
) => ({
  from: from ?? null,
  to: to ?? null,
});

/**
 * ---------------------------------------------------------
 * AFFILIATE OVERVIEW
 * ---------------------------------------------------------
 */
export const getAffiliateOverview = async ({
  from,
  to,
}: {
  from?: string;
  to?: string;
}) => {
  const clickConditions = getClickDateConditions(
    from,
    to
  );

  const clickWhere =
    clickConditions.length > 0
      ? Prisma.sql`
          WHERE ${Prisma.join(
            clickConditions,
            " AND "
          )}
        `
      : Prisma.empty;

  const [
    clickStats,
    activeProducts,
    activeMarketplaces,
  ] = await Promise.all([
    prisma.$queryRaw<
      {
        totalClicks: bigint;
        uniqueVisitors: bigint;
        legacyUniqueClicks: bigint;
        countries: bigint;
        regions: bigint;
        referralSources: bigint;
        campaigns: bigint;
      }[]
    >(
      Prisma.sql`
        SELECT
          COUNT(*)::bigint AS "totalClicks",
          COUNT(DISTINCT ac."visitorHash")::bigint
            AS "uniqueVisitors",
          COUNT(DISTINCT ac."ipHash") FILTER (
            WHERE ac."visitorHash" IS NULL
          )::bigint AS "legacyUniqueClicks",
          COUNT(DISTINCT ac."countryCode")::bigint AS "countries",
          COUNT(DISTINCT (ac."countryCode", ac."region")) FILTER (
            WHERE ac."countryCode" IS NOT NULL OR ac."region" IS NOT NULL
          )::bigint AS "regions",
          COUNT(DISTINCT ac."referrerHost")::bigint AS "referralSources",
          COUNT(DISTINCT ac."utmCampaign")::bigint AS "campaigns"
        FROM "AffiliateClick" ac
        ${clickWhere}
      `
    ),

    prisma.affiliateProduct.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.affiliateMarketplace.count({
      where: {
        status: "ACTIVE",
      },
    }),
  ]);

  return {
    totalClicks: Number(
      clickStats[0]?.totalClicks ?? 0
    ),

    uniqueVisitors: Number(
      clickStats[0]?.uniqueVisitors ?? 0
    ),

    legacyUniqueClicks: Number(
      clickStats[0]?.legacyUniqueClicks ?? 0
    ),

    countries: Number(
      clickStats[0]?.countries ?? 0
    ),

    regions: Number(
      clickStats[0]?.regions ?? 0
    ),

    referralSources: Number(
      clickStats[0]?.referralSources ?? 0
    ),

    campaigns: Number(
      clickStats[0]?.campaigns ?? 0
    ),

    activeProducts,
    activeMarketplaces,

    period: getPeriod(from, to),
  };
};

/**
 * ---------------------------------------------------------
 * AFFILIATE PRODUCT REPORT
 * ---------------------------------------------------------
 *
 * Important:
 * - No N+1 click count queries
 * - Click counts calculated by PostgreSQL
 * - Pagination happens in PostgreSQL
 * - Sorting happens in PostgreSQL
 * - No _count leakage
 */
export const getAffiliateProductReport = async ({
  from,
  to,
  page = 1,
  limit = 20,
  search,
  marketplaceId,
  categoryId,
  brandId,
}: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  search?: string;
  marketplaceId?: string;
  categoryId?: string;
  brandId?: string;
}) => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(
    Math.max(limit, 1),
    100
  );

  const skip = (safePage - 1) * safeLimit;

  const productConditions: Prisma.Sql[] = [];

  if (search?.trim()) {
    const searchPattern = `%${search.trim()}%`;

    productConditions.push(
      Prisma.sql`
        ap."name" ILIKE ${searchPattern}
      `
    );
  }

  if (marketplaceId) {
    productConditions.push(
      Prisma.sql`
        ap."marketplaceId" = ${marketplaceId}::uuid
      `
    );
  }

  if (categoryId) {
    productConditions.push(
      Prisma.sql`
        ap."categoryId" = ${categoryId}::uuid
      `
    );
  }

  if (brandId) {
    productConditions.push(
      Prisma.sql`
        ap."brandId" = ${brandId}::uuid
      `
    );
  }

  const productWhere =
    productConditions.length > 0
      ? Prisma.sql`
          WHERE ${Prisma.join(
            productConditions,
            " AND "
          )}
        `
      : Prisma.empty;

  const clickConditions =
    getClickDateConditions(from, to);

  const clickWhere =
    clickConditions.length > 0
      ? Prisma.sql`
          AND ${Prisma.join(
            clickConditions,
            " AND "
          )}
        `
      : Prisma.empty;

  /**
   * Count products before pagination.
   */
  const countResult = await prisma.$queryRaw<
    { count: bigint }[]
  >(
    Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "AffiliateProduct" ap
      ${productWhere}
    `
  );

  const total = Number(
    countResult[0]?.count ?? 0
  );

  /**
   * Fetch products + filtered click count
   * in a single database query.
   */
  const products = await prisma.$queryRaw<
    {
      id: string;
      name: string;
      slug: string;
      displayPrice: unknown;
      status: string;

      marketplaceId: string;
      marketplaceName: string;
      marketplaceCode: string;

      categoryId: string | null;
      categoryName: string | null;

      brandId: string | null;
      brandName: string | null;

      clickCount: bigint;
      uniqueVisitors: bigint;
      legacyUniqueClicks: bigint;
      clickedMarketplaces: string[];
    }[]
  >(
    Prisma.sql`
      SELECT
        ap."id",
        ap."name",
        ap."slug",
        ap."displayPrice",
        ap."status",

        am."id" AS "marketplaceId",
        am."name" AS "marketplaceName",
        am."code" AS "marketplaceCode",

        c."id" AS "categoryId",
        c."name" AS "categoryName",

        b."id" AS "brandId",
        b."name" AS "brandName",

        COUNT(ac."id")::bigint AS "clickCount",
        COUNT(DISTINCT ac."visitorHash")::bigint AS "uniqueVisitors",
        COUNT(DISTINCT ac."ipHash") FILTER (
          WHERE ac."visitorHash" IS NULL
        )::bigint AS "legacyUniqueClicks",
        COALESCE(
          ARRAY_AGG(DISTINCT clickedMarketplace."name")
            FILTER (WHERE clickedMarketplace."id" IS NOT NULL),
          ARRAY[]::TEXT[]
        ) AS "clickedMarketplaces"

      FROM "AffiliateProduct" ap

      INNER JOIN "AffiliateMarketplace" am
        ON am."id" = ap."marketplaceId"

      LEFT JOIN "Category" c
        ON c."id" = ap."categoryId"

      LEFT JOIN "Brand" b
        ON b."id" = ap."brandId"

      LEFT JOIN "AffiliateClick" ac
        ON ac."affiliateProductId" = ap."id"
        ${clickWhere}

      LEFT JOIN "AffiliateMarketplace" clickedMarketplace
        ON clickedMarketplace."id" = ac."marketplaceId"

      ${productWhere}

      GROUP BY
        ap."id",
        ap."name",
        ap."slug",
        ap."displayPrice",
        ap."status",

        am."id",
        am."name",
        am."code",

        c."id",
        c."name",

        b."id",
        b."name"

      ORDER BY
        COUNT(ac."id") DESC,
        ap."createdAt" DESC

      LIMIT ${safeLimit}
      OFFSET ${skip}
    `
  );

  const formattedProducts = products.map(
    (product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      displayPrice: product.displayPrice,
      status: product.status,

      marketplace: {
        id: product.marketplaceId,
        name: product.marketplaceName,
        code: product.marketplaceCode,
      },

      category: product.categoryId
        ? {
            id: product.categoryId,
            name: product.categoryName,
          }
        : null,

      brand: product.brandId
        ? {
            id: product.brandId,
            name: product.brandName,
          }
        : null,

      clickCount: Number(
        product.clickCount
      ),
      uniqueVisitors: Number(product.uniqueVisitors),
      legacyUniqueClicks: Number(product.legacyUniqueClicks),
      clickedMarketplaces: product.clickedMarketplaces,
    })
  );

  return {
    products: formattedProducts,

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(
        total / safeLimit
      ),
    },

    period: getPeriod(from, to),
  };
};

/**
 * ---------------------------------------------------------
 * AFFILIATE MARKETPLACE REPORT
 * ---------------------------------------------------------
 *
 * Product count and filtered click count are calculated
 * directly by PostgreSQL.
 */
export const getAffiliateMarketplaceReport =
  async ({
    from,
    to,
  }: {
    from?: string;
    to?: string;
  }) => {
    const clickConditions =
      getClickDateConditions(from, to);

    const marketplaceClickConditions = [
      ...clickConditions,
      Prisma.sql`ac."marketplaceId" = am."id"`,
    ];
    const marketplaceClickWhere = Prisma.sql`
      WHERE ${Prisma.join(
        marketplaceClickConditions,
        " AND "
      )}
    `;

    const marketplaces = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        code: string;
        status: string;
        productCount: bigint;
        clickCount: bigint;
        uniqueVisitors: bigint;
      }[]
    >(
      Prisma.sql`
        SELECT
          am."id",
          am."name",
          am."code",
          am."status",

          (
            SELECT COUNT(*)::bigint
            FROM "AffiliateProduct" ap
            WHERE ap."marketplaceId" = am."id"
          ) AS "productCount",

          (
            SELECT COUNT(*)::bigint
            FROM "AffiliateClick" ac
            ${marketplaceClickWhere}
          ) AS "clickCount",

          (
            SELECT COUNT(DISTINCT ac."visitorHash")::bigint
            FROM "AffiliateClick" ac
            ${marketplaceClickWhere}
          ) AS "uniqueVisitors"

        FROM "AffiliateMarketplace" am

        ORDER BY
          (
            SELECT COUNT(*)::bigint
            FROM "AffiliateClick" ac
            ${marketplaceClickWhere}
          ) DESC,

          am."name" ASC
      `
    );

    return {
      marketplaces:
        marketplaces.map((marketplace) => ({
          id: marketplace.id,
          name: marketplace.name,
          code: marketplace.code,
          status: marketplace.status,

          productCount: Number(
            marketplace.productCount
          ),

          clickCount: Number(
            marketplace.clickCount
          ),
          uniqueVisitors: Number(marketplace.uniqueVisitors),
        })),

      period: getPeriod(from, to),
    };
  };

export const getAffiliateBreakdownReport = async ({
  from,
  to,
}: {
  from?: string;
  to?: string;
}) => {
  const clickConditions = getClickDateConditions(from, to);
  const whereClause =
    clickConditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(clickConditions, " AND ")}`
      : Prisma.empty;

  const [locations, referralSources, campaigns, landingPages] =
    await Promise.all([
      prisma.$queryRaw<
        {
          countryCode: string | null;
          region: string | null;
          city: string | null;
          clickCount: bigint;
          uniqueVisitors: bigint;
        }[]
      >(
        Prisma.sql`
          SELECT
            ac."countryCode",
            ac."region",
            ac."city",
            COUNT(*)::bigint AS "clickCount",
            COUNT(DISTINCT ac."visitorHash")::bigint AS "uniqueVisitors"
          FROM "AffiliateClick" ac
          ${whereClause}
          GROUP BY ac."countryCode", ac."region", ac."city"
          ORDER BY COUNT(*) DESC
          LIMIT 100
        `
      ),
      prisma.$queryRaw<
        {
          referrerHost: string | null;
          clickCount: bigint;
          uniqueVisitors: bigint;
        }[]
      >(
        Prisma.sql`
          SELECT
            ac."referrerHost",
            COUNT(*)::bigint AS "clickCount",
            COUNT(DISTINCT ac."visitorHash")::bigint AS "uniqueVisitors"
          FROM "AffiliateClick" ac
          ${whereClause}
          GROUP BY ac."referrerHost"
          ORDER BY COUNT(*) DESC
          LIMIT 50
        `
      ),
      prisma.$queryRaw<
        {
          utmSource: string | null;
          utmMedium: string | null;
          utmCampaign: string | null;
          clickCount: bigint;
          uniqueVisitors: bigint;
        }[]
      >(
        Prisma.sql`
          SELECT
            ac."utmSource",
            ac."utmMedium",
            ac."utmCampaign",
            COUNT(*)::bigint AS "clickCount",
            COUNT(DISTINCT ac."visitorHash")::bigint AS "uniqueVisitors"
          FROM "AffiliateClick" ac
          ${whereClause}
          GROUP BY ac."utmSource", ac."utmMedium", ac."utmCampaign"
          ORDER BY COUNT(*) DESC
          LIMIT 50
        `
      ),
      prisma.$queryRaw<
        {
          landingPath: string | null;
          clickCount: bigint;
          uniqueVisitors: bigint;
        }[]
      >(
        Prisma.sql`
          SELECT
            ac."landingPath",
            COUNT(*)::bigint AS "clickCount",
            COUNT(DISTINCT ac."visitorHash")::bigint AS "uniqueVisitors"
          FROM "AffiliateClick" ac
          ${whereClause}
          GROUP BY ac."landingPath"
          ORDER BY COUNT(*) DESC
          LIMIT 50
        `
      ),
    ]);

  return {
    locations: locations.map((row) => ({
      countryCode: row.countryCode,
      region: row.region,
      city: row.city,
      clickCount: Number(row.clickCount),
      uniqueVisitors: Number(row.uniqueVisitors),
    })),
    referralSources: referralSources.map((row) => ({
      hostname: displayReferralSource(row.referrerHost),
      clickCount: Number(row.clickCount),
      uniqueVisitors: Number(row.uniqueVisitors),
    })),
    campaigns: campaigns.map((row) => ({
      source: row.utmSource,
      medium: row.utmMedium,
      campaign: row.utmCampaign ?? "Unattributed",
      clickCount: Number(row.clickCount),
      uniqueVisitors: Number(row.uniqueVisitors),
    })),
    landingPages: landingPages.map((row) => ({
      path: row.landingPath ?? "Unknown landing page",
      clickCount: Number(row.clickCount),
      uniqueVisitors: Number(row.uniqueVisitors),
    })),
    period: getPeriod(from, to),
  };
};
/**
 * ---------------------------------------------------------
 * AFFILIATE TREND REPORT
 * ---------------------------------------------------------
 *
 * PostgreSQL performs:
 * - date grouping
 * - total click count
 * - consented unique visitor count
 *
 * Node.js no longer loads every click into memory.
 */
export const getAffiliateTrendReport =
  async ({
    from,
    to,
  }: {
    from?: string;
    to?: string;
  }) => {
    const clickConditions =
      getClickDateConditions(from, to);

    const whereClause =
      clickConditions.length > 0
        ? Prisma.sql`
            WHERE ${Prisma.join(
              clickConditions,
              " AND "
            )}
          `
        : Prisma.empty;

    const trends = await prisma.$queryRaw<
      {
        date: string;
        clicks: bigint;
        uniqueVisitors: bigint;
        legacyUniqueClicks: bigint;
      }[]
    >(
      Prisma.sql`
        SELECT
          TO_CHAR(
            DATE_TRUNC(
              'day',
              (ac."clickedAt" AT TIME ZONE 'UTC')
                AT TIME ZONE 'Asia/Kolkata'
            ),
            'YYYY-MM-DD'
          ) AS "date",

          COUNT(*)::bigint
            AS "clicks",

          COUNT(DISTINCT ac."visitorHash")::bigint
            AS "uniqueVisitors",
          COUNT(DISTINCT ac."ipHash") FILTER (
            WHERE ac."visitorHash" IS NULL
          )::bigint AS "legacyUniqueClicks"

        FROM "AffiliateClick" ac

        ${whereClause}

        GROUP BY
          DATE_TRUNC(
            'day',
            (ac."clickedAt" AT TIME ZONE 'UTC')
              AT TIME ZONE 'Asia/Kolkata'
          )

        ORDER BY
          "date" ASC
      `
    );

    return {
      trends: trends.map((trend) => ({
        date: trend.date,

        clicks: Number(
          trend.clicks
        ),

        uniqueVisitors: Number(trend.uniqueVisitors),
        legacyUniqueClicks: Number(trend.legacyUniqueClicks),
      })),

      period: getPeriod(from, to),
    };
  };