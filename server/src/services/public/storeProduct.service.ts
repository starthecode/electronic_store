import { prisma } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../utils/AppError.js";
import { parseAffiliateImageUrls } from "../../utils/affiliateImageUrls.js";

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

    const affiliateWhere = {
        status: "ACTIVE" as const,
        marketplace: {
            status: "ACTIVE" as const,
        },
        ...(categoryId ? { categoryId } : {}),
        ...(brandId ? { brandId } : {}),
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
                        externalProductId: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                ],
            }
            : {}),
        ...(minPrice !== undefined || maxPrice !== undefined
            ? {
                displayPrice: {
                    ...(minPrice !== undefined ? { gte: minPrice } : {}),
                    ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
                },
            }
            : {}),
    };

    const [regularTotal, affiliateTotal] = await Promise.all([
        prisma.product.count({ where }),
        prisma.affiliateProduct.count({ where: affiliateWhere }),
    ]);

    const regularSelect = {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
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
                sortOrder: "asc" as const,
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
                status: "ACTIVE" as const,
            },
            select: publicVariantSelect,
            orderBy: {
                price: "asc" as const,
            },
        },
    } as const;

    const affiliateSelect = {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        imageUrl: true,
        imageUrls: true,
        displayPrice: true,
        createdAt: true,
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
        marketplace: {
            select: {
                id: true,
                name: true,
                code: true,
                logoUrl: true,
            },
        },
    } as const;

    const regularConditions = [
        Prisma.sql`p.status = 'ACTIVE'`,
    ];
    const affiliateConditions = [
        Prisma.sql`affiliateProduct.status = 'ACTIVE'`,
        Prisma.sql`marketplace.status = 'ACTIVE'`,
    ];

    if (categoryId) {
        regularConditions.push(
            Prisma.sql`p."categoryId" = ${categoryId}::uuid`
        );
        affiliateConditions.push(
            Prisma.sql`affiliateProduct."categoryId" = ${categoryId}::uuid`
        );
    }

    if (brandId) {
        regularConditions.push(
            Prisma.sql`p."brandId" = ${brandId}::uuid`
        );
        affiliateConditions.push(
            Prisma.sql`affiliateProduct."brandId" = ${brandId}::uuid`
        );
    }

    const variantConditions = [
        Prisma.sql`filteredVariant."productId" = p.id`,
        Prisma.sql`filteredVariant.status = 'ACTIVE'`,
    ];

    if (minPrice !== undefined) {
        variantConditions.push(
            Prisma.sql`filteredVariant.price >= ${minPrice}`
        );
    }

    if (maxPrice !== undefined) {
        variantConditions.push(
            Prisma.sql`filteredVariant.price <= ${maxPrice}`
        );
    }

    regularConditions.push(
        Prisma.sql`EXISTS (
            SELECT 1
            FROM "ProductVariant" filteredVariant
            WHERE ${Prisma.join(variantConditions, " AND ")}
        )`
    );

    if (search) {
        const pattern = `%${search}%`;

        regularConditions.push(
            Prisma.sql`(
                p.name ILIKE ${pattern}
                OR p.slug ILIKE ${pattern}
                OR EXISTS (
                    SELECT 1
                    FROM "ProductVariant" searchedVariant
                    WHERE searchedVariant."productId" = p.id
                        AND searchedVariant.status = 'ACTIVE'
                        AND searchedVariant.sku ILIKE ${pattern}
                )
            )`
        );
        affiliateConditions.push(
            Prisma.sql`(
                affiliateProduct.name ILIKE ${pattern}
                OR affiliateProduct.slug ILIKE ${pattern}
                OR affiliateProduct."externalProductId" ILIKE ${pattern}
            )`
        );
    }

    const direction =
        sortOrder === "asc"
            ? Prisma.sql`ASC`
            : Prisma.sql`DESC`;
    const ordering =
        sortBy === "price"
            ? Prisma.sql`catalog.price ${direction} NULLS LAST`
            : sortBy === "name"
                ? Prisma.sql`catalog.name ${direction}`
                : Prisma.sql`catalog."createdAt" ${direction}`;

    const orderedRows = await prisma.$queryRaw<
        Array<{ id: string; type: "regular" | "affiliate" }>
    >(
        Prisma.sql`
            SELECT catalog.id, catalog.type
            FROM (
                SELECT
                    p.id,
                    'regular'::text AS type,
                    p.name,
                    p.slug,
                    p."createdAt",
                    (
                        SELECT MIN(activeVariant.price)
                        FROM "ProductVariant" activeVariant
                        WHERE activeVariant."productId" = p.id
                            AND activeVariant.status = 'ACTIVE'
                    ) AS price
                FROM "Product" p
                WHERE ${Prisma.join(regularConditions, " AND ")}

                UNION ALL

                SELECT
                    affiliateProduct.id,
                    'affiliate'::text AS type,
                    affiliateProduct.name,
                    affiliateProduct.slug,
                    affiliateProduct."createdAt",
                    affiliateProduct."displayPrice" AS price
                FROM "AffiliateProduct" affiliateProduct
                INNER JOIN "AffiliateMarketplace" marketplace
                    ON marketplace.id = affiliateProduct."marketplaceId"
                WHERE ${Prisma.join(affiliateConditions, " AND ")}
            ) catalog
            ORDER BY ${ordering}, catalog.type ASC, catalog.id ASC
            OFFSET ${offset}
            LIMIT ${safeLimit}
        `
    );

    const regularIds = orderedRows
        .filter((row) => row.type === "regular")
        .map((row) => row.id);
    const affiliateIds = orderedRows
        .filter((row) => row.type === "affiliate")
        .map((row) => row.id);

    const [regularProducts, affiliateProducts] = await Promise.all([
        regularIds.length
            ? prisma.product.findMany({
                where: { id: { in: regularIds } },
                select: regularSelect,
            })
            : Promise.resolve([]),
        affiliateIds.length
            ? prisma.affiliateProduct.findMany({
                where: { id: { in: affiliateIds } },
                select: affiliateSelect,
            })
            : Promise.resolve([]),
    ]);

    const regularById = new Map(
        regularProducts.map((product) => [product.id, product])
    );
    const affiliateById = new Map(
        affiliateProducts.map((product) => [product.id, product])
    );
    const products = orderedRows.map((row) => {
        if (row.type === "affiliate") {
            const product = affiliateById.get(row.id);
            if (!product) {
                throw new AppError(
                    "Affiliate product changed while loading the catalog",
                    409
                );
            }

            return {
                ...product,
                imageUrls: parseAffiliateImageUrls(
                    product.imageUrls,
                    product.imageUrl
                ),
                type: "affiliate" as const,
            };
        }

        const product = regularById.get(row.id);
        if (!product) {
            throw new AppError(
                "Product changed while loading the catalog",
                409
            );
        }

        return {
            ...product,
            type: "regular" as const,
            variants: product.variants.map(toPublicVariant),
        };
    });

    const total = regularTotal + affiliateTotal;

    return {
        products: products.slice(offset, offset + safeLimit),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        },
    };
};

export const getStoreProductBySlug = async (
    slug: string,
    type?: "affiliate",
) => {
    const product = type === "affiliate"
        ? null
        : await prisma.product.findFirst({
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

    if (product) {
        return {
            ...product,
            type: "regular" as const,
            variants: product.variants.map(toPublicVariant),
        };
    }

    const affiliateProduct =
        await prisma.affiliateProduct.findFirst({
            where: {
                slug,
                status: "ACTIVE",
                marketplace: {
                    status: "ACTIVE",
                },
            },
            select: {
                id: true,
                name: true,
                slug: true,
                shortDescription: true,
                description: true,
                imageUrl: true,
                imageUrls: true,
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
                marketplace: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        logoUrl: true,
                    },
                },
                externalProductId: true,
                displayPrice: true,
            },
        });

    if (!affiliateProduct) {
        throw new AppError("Product not found", 404);
    }

    const imageUrls = parseAffiliateImageUrls(
        affiliateProduct.imageUrls,
        affiliateProduct.imageUrl
    );

    const specifications = [
        affiliateProduct.brand?.name
            ? {
                id: `${affiliateProduct.id}-brand`,
                specification: { name: "Brand" },
                value: affiliateProduct.brand.name,
            }
            : null,
        affiliateProduct.category?.name
            ? {
                id: `${affiliateProduct.id}-category`,
                specification: { name: "Category" },
                value: affiliateProduct.category.name,
            }
            : null,
        affiliateProduct.marketplace?.name
            ? {
                id: `${affiliateProduct.id}-marketplace`,
                specification: { name: "Marketplace" },
                value: affiliateProduct.marketplace.name,
            }
            : null,
        affiliateProduct.externalProductId
            ? {
                id: `${affiliateProduct.id}-external-id`,
                specification: { name: "Marketplace product ID" },
                value: affiliateProduct.externalProductId,
            }
            : null,
    ].filter((item) => item !== null);

    return {
        ...affiliateProduct,
        type: "affiliate" as const,
        imageUrls,
        imageUrl: imageUrls[0] ?? null,
        images: imageUrls.map((url, index) => ({
            id: `${affiliateProduct.id}-image-${index}`,
            url,
            altText: affiliateProduct.name,
            sortOrder: index,
            isPrimary: index === 0,
        })),
        variants: [],
        specifications,
    };
};