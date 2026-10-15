import { prisma } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";

const getDateRange = (
  from?: string,
  to?: string
) => {
  const start = from
    ? new Date(`${from}T00:00:00.000Z`)
    : undefined;

  const end = to
    ? new Date(`${to}T23:59:59.999Z`)
    : undefined;

  return {
    start,
    end,
  };
};

/**
 * Build SQL conditions for affiliate clicks date filtering.
 */
const getClickDateConditions = (
  from?: string,
  to?: string
): Prisma.Sql[] => {
  const { start, end } = getDateRange(from, to);

  const conditions: Prisma.Sql[] = [];

  if (start) {
    conditions.push(
      Prisma.sql`ac."clickedAt" >= ${start}`
    );
  }

  if (end) {
    conditions.push(
      Prisma.sql`ac."clickedAt" <= ${end}`
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
        uniqueClicks: bigint;
      }[]
    >(
      Prisma.sql`
        SELECT
          COUNT(*)::bigint AS "totalClicks",
          COUNT(DISTINCT ac."ipHash")::bigint AS "uniqueClicks"
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

    uniqueClicks: Number(
      clickStats[0]?.uniqueClicks ?? 0
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

        COUNT(ac."id")::bigint AS "clickCount"

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

    const clickWhere =
      clickConditions.length > 0
        ? Prisma.sql`
            WHERE ${Prisma.join(
              clickConditions,
              " AND "
            )}
          `
        : Prisma.empty;

    const marketplaces = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        code: string;
        status: string;
        productCount: bigint;
        clickCount: bigint;
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
            ${clickWhere}
            AND ac."marketplaceId" = am."id"
          ) AS "clickCount"

        FROM "AffiliateMarketplace" am

        ORDER BY
          (
            SELECT COUNT(*)::bigint
            FROM "AffiliateClick" ac
            ${clickWhere}
            AND ac."marketplaceId" = am."id"
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
 * - unique IP count
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
        date: Date;
        clicks: bigint;
        uniqueClicks: bigint;
      }[]
    >(
      Prisma.sql`
        SELECT
          DATE_TRUNC(
            'day',
            ac."clickedAt"
          ) AS "date",

          COUNT(*)::bigint
            AS "clicks",

          COUNT(
            DISTINCT ac."ipHash"
          )::bigint
            AS "uniqueClicks"

        FROM "AffiliateClick" ac

        ${whereClause}

        GROUP BY
          DATE_TRUNC(
            'day',
            ac."clickedAt"
          )

        ORDER BY
          "date" ASC
      `
    );

    return {
      trends: trends.map((trend) => ({
        date: trend.date
          .toISOString()
          .slice(0, 10),

        clicks: Number(
          trend.clicks
        ),

        uniqueClicks: Number(
          trend.uniqueClicks
        ),
      })),

      period: getPeriod(from, to),
    };
  };