import { prisma } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../utils/AppError.js";

interface StoreProductListInput {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy: "createdAt" | "name" | "price";
    sortOrder: "asc" | "desc";
}

const publicVariantSelect = {
    id: true,
    name: true,
    sku: true,
    price: true,
    compareAtPrice: true,
    status: true,

    attributes: {
        include: {
            attributeValue: {
                include: {
                    attribute: true,
                },
            },
        },
    },

    inventory: {
        select: {
            quantity: true,
            reservedQuantity: true,
        },
    },
};

const toPublicVariant = (variant: any) => {
    const quantity = variant.inventory?.quantity ?? 0;
    const reservedQuantity = variant.inventory?.reservedQuantity ?? 0;

    const availableQuantity = Math.max(
        0,
        quantity - reservedQuantity,
    );

    return {
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        status: variant.status,

        attributes: variant.attributes,

        inStock: availableQuantity > 0,
        stockStatus:
            availableQuantity <= 0
                ? "OUT_OF_STOCK"
                : availableQuantity <= 5
                    ? "LOW_STOCK"
                    : "IN_STOCK",
    };
};


export const getStoreProducts = async ({
    page,
    limit,
    search,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
}: StoreProductListInput) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const offset = (safePage - 1) * safeLimit;

    /*
     * Common Prisma filters.
     *
     * A product is public only when:
     * - Product is ACTIVE
     * - It has at least one ACTIVE variant
     * - The variant satisfies the optional price filter
     */
    const where = {
        status: "ACTIVE" as const,

        ...(categoryId
            ? {
                categoryId,
            }
            : {}),

        ...(brandId
            ? {
                brandId,
            }
            : {}),

        ...(search
            ? {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        slug: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        variants: {
                            some: {
                                status: "ACTIVE" as const,
                                sku: {
                                    contains: search,
                                    mode: "insensitive" as const,
                                },
                            },
                        },
                    },
                ],
            }
            : {}),

        variants: {
            some: {
                status: "ACTIVE" as const,

                ...(minPrice !== undefined || maxPrice !== undefined
                    ? {
                        price: {
                            ...(minPrice !== undefined
                                ? {
                                    gte: minPrice,
                                }
                                : {}),

                            ...(maxPrice !== undefined
                                ? {
                                    lte: maxPrice,
                                }
                                : {}),
                        },
                    }
                    : {}),
            },
        },
    };

    /*
     * Total count.
     */
    const total = await prisma.product.count({
        where,
    });

    /*
     * PRICE SORT
     *
     * Price belongs to ProductVariant, not Product.
     *
     * Therefore PostgreSQL calculates:
     *
     * MIN(active variant price)
     *
     * before OFFSET/LIMIT.
     */
    if (sortBy === "price") {
        const priceDirection =
            sortOrder === "asc"
                ? Prisma.sql`ASC`
                : Prisma.sql`DESC`;

        /*
         * Build SQL conditions.
         *
         * All values remain parameterized.
         */
        const conditions = [
            Prisma.sql`p.status = 'ACTIVE'`,
            Prisma.sql`v.status = 'ACTIVE'`,
        ];

        if (categoryId) {
            conditions.push(
                Prisma.sql`p."categoryId" = ${categoryId}::uuid`
            );
        }

        if (brandId) {
            conditions.push(
                Prisma.sql`p."brandId" = ${brandId}::uuid`
            );
        }

        if (search) {
            const searchPattern = `%${search}%`;

            conditions.push(
                Prisma.sql`(
                    p.name ILIKE ${searchPattern}
                    OR p.slug ILIKE ${searchPattern}
                    OR v.sku ILIKE ${searchPattern}
                )`
            );
        }

        if (minPrice !== undefined) {
            conditions.push(
                Prisma.sql`v.price >= ${minPrice}`
            );
        }

        if (maxPrice !== undefined) {
            conditions.push(
                Prisma.sql`v.price <= ${maxPrice}`
            );
        }

        const whereSql = Prisma.join(
            conditions,
            " AND "
        );

        const orderedRows = await prisma.$queryRaw<
            Array<{ id: string }>
        >(
            Prisma.sql`
                SELECT
                    p.id
                FROM "Product" p
                INNER JOIN "ProductVariant" v
                    ON v."productId" = p.id
                WHERE ${whereSql}
                GROUP BY p.id
                ORDER BY MIN(v.price) ${priceDirection}, p.id ASC
                OFFSET ${offset}
                LIMIT ${safeLimit}
            `
        );

        const orderedIds = orderedRows.map(
            (row) => row.id
        );

        if (!orderedIds.length) {
            return {
                products: [],
                pagination: {
                    page: safePage,
                    limit: safeLimit,
                    total,
                    totalPages: Math.ceil(
                        total / safeLimit
                    ),
                },
            };
        }

        /*
         * Fetch the complete public product data.
         */
        const products = await prisma.product.findMany({
            where: {
                ...where,
                id: {
                    in: orderedIds,
                },
            },

            select: {
                id: true,
                name: true,
                slug: true,
                description: true,

                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },

                brand: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
                    },
                },

                images: {
                    orderBy: {
                        sortOrder: "asc",
                    },
                    select: {
                        id: true,
                        url: true,
                        altText: true,
                        isPrimary: true,
                        sortOrder: true,
                    },
                },

                variants: {
                    where: {
                        status: "ACTIVE",
                    },
                    select: publicVariantSelect,
                    orderBy: {
                        price: "asc",
                    },
                },
            },
        });

        /*
         * Prisma does not guarantee the same order as
         * orderedIds, so restore PostgreSQL's ordering.
         */
        const productMap = new Map(
            products.map((product) => [
                product.id,
                product,
            ])
        );

        const orderedProducts = orderedIds
            .map((id) => productMap.get(id))
            .filter(
                (
                    product
                ): product is (typeof products)[number] =>
                    Boolean(product)
            );

        return {
            products: orderedProducts.map(
                (product) => ({
                    ...product,
                    variants:
                        product.variants.map(
                            toPublicVariant
                        ),
                })
            ),

            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(
                    total / safeLimit
                ),
            },
        };
    }

    /*
     * NORMAL SORTING
     *
     * createdAt / name can be handled directly by Prisma.
     */
    const orderBy: Prisma.ProductOrderByWithRelationInput =
        sortBy === "name"
            ? {
                name: sortOrder,
            }
            : {
                createdAt: sortOrder,
            };

    const products = await prisma.product.findMany({
        where,

        select: {
            id: true,
            name: true,
            slug: true,
            description: true,

            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },

            brand: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    logoUrl: true,
                },
            },

            images: {
                orderBy: {
                    sortOrder: "asc",
                },
                select: {
                    id: true,
                    url: true,
                    altText: true,
                    isPrimary: true,
                    sortOrder: true,
                },
            },

            variants: {
                where: {
                    status: "ACTIVE",
                },
                select: publicVariantSelect,
                orderBy: {
                    price: "asc",
                },
            },
        },

        skip: offset,
        take: safeLimit,

        orderBy,
    });

    return {
        products: products.map(
            (product) => ({
                ...product,
                variants:
                    product.variants.map(
                        toPublicVariant
                    ),
            })
        ),

        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(
                total / safeLimit
            ),
        },
    };
};

export const getStoreProductBySlug = async (
    slug: string,
) => {
    const product = await prisma.product.findFirst({
        where: {
            slug,
            status: "ACTIVE",
        },

        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            shortDescription: true,

            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },

            brand: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    logoUrl: true,
                },
            },

            images: {
                orderBy: {
                    sortOrder: "asc",
                },
                select: {
                    id: true,
                    url: true,
                    altText: true,
                    sortOrder: true,
                    isPrimary: true,
                },
            },

            variants: {
                where: {
                    status: "ACTIVE",
                },
                select: publicVariantSelect,
                orderBy: {
                    createdAt: "asc",
                },
            },

            specifications: {
                include: {
                    specification: {
                        select: {
                            id: true,
                            name: true,

                            group: {
                                select: {
                                    id: true,
                                    name: true,
                                    sortOrder: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    return {
        ...product,

        variants: product.variants.map(toPublicVariant),
    };
};