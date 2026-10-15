import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

interface CreateVariantInput {
    name?: string | null;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

interface UpdateVariantInput {
    name?: string | null;
    sku?: string;
    price?: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

interface ListVariantsInput {
    page: number;
    limit: number;
    search?: string;
    status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

const ensureProductExists = async (productId: string) => {
    const product = await prisma.product.findUnique({
        where: {
            id: productId,
        },
        select: {
            id: true,
        },
    });

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    return product;
};

const ensureSkuUnique = async (
    sku: string,
    excludeId?: string
) => {
    const existing = await prisma.productVariant.findFirst({
        where: {
            sku,
            ...(excludeId
                ? {
                    id: {
                        not: excludeId,
                    },
                }
                : {}),
        },

        select: {
            id: true,
        },
    });

    if (existing) {
        throw new AppError(
            "Variant SKU already exists",
            409
        );
    }
};

const validatePricing = (
    price: number,
    compareAtPrice?: number | null,
    costPrice?: number | null
) => {
    if (
        compareAtPrice !== null &&
        compareAtPrice !== undefined &&
        compareAtPrice < price
    ) {
        throw new AppError(
            "Compare-at price must be greater than or equal to price",
            400
        );
    }

    if (
        costPrice !== null &&
        costPrice !== undefined &&
        costPrice > price
    ) {
        throw new AppError(
            "Cost price should not be greater than selling price",
            400
        );
    }
};

export const createProductVariant = async (
    productId: string,
    input: CreateVariantInput,
    userId: string
) => {
    await ensureProductExists(productId);

    await ensureSkuUnique(input.sku);

    validatePricing(
        input.price,
        input.compareAtPrice,
        input.costPrice
    );

    const variant = await prisma.productVariant.create({
        data: {
            productId,

            name: input.name ?? null,

            sku: input.sku,

            price: input.price,

            compareAtPrice:
                input.compareAtPrice ?? null,

            costPrice:
                input.costPrice ?? null,

            status:
                input.status ?? "ACTIVE",
        },

        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    await createAuditLog({
        userId,
        action: "CREATE",
        entity: "ProductVariant",
        entityId: variant.id,
        description: `Created product variant "${variant.name ?? variant.sku}"`,
        metadata: {
            productId: variant.productId,
            sku: variant.sku,
            price: variant.price.toString(),
        },
    });

    return variant;
};

export const getProductVariants = async (
    productId: string,
    {
        page,
        limit,
        search,
        status,
    }: ListVariantsInput
) => {
    await ensureProductExists(productId);

    const skip = (page - 1) * limit;

    const where = {
        productId,

        ...(search
            ? {
                OR: [
                    {
                        sku: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                ],
            }
            : {}),

        ...(status
            ? {
                status,
            }
            : {}),
    };

    const [variants, total] =
        await prisma.$transaction([
            prisma.productVariant.findMany({
                where,

                orderBy: {
                    createdAt: "desc",
                },

                skip,

                take: limit,

                include: {
                    inventory: true,

                    _count: {
                        select: {
                            attributes: true,
                            inventoryTransactions: true,
                            orderItems: true,
                        },
                    },
                },
            }),

            prisma.productVariant.count({
                where,
            }),
        ]);

    return {
        variants,

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getProductVariantById = async (
    productId: string,
    variantId: string
) => {
    const variant =
        await prisma.productVariant.findFirst({
            where: {
                id: variantId,
                productId,
            },

            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                attributes: {
                    include: {
                        attributeValue: {
                            include: {
                                attribute: true,
                            },
                        },
                    },
                },
                inventory: true,
                _count: {
                    select: {
                        attributes: true,
                        inventoryTransactions: true,
                        orderItems: true,
                    },
                },
            },
        });

    if (!variant) {
        throw new AppError(
            "Product variant not found",
            404
        );
    }

    return variant;
};

export const updateProductVariant = async (
    productId: string,
    variantId: string,
    input: UpdateVariantInput,
    userId: string
) => {
    await ensureProductExists(productId);
    const existing =
        await prisma.productVariant.findFirst({
            where: {
                id: variantId,
                productId,
            },
        });

    if (!existing) {
        throw new AppError(
            "Product variant not found",
            404
        );
    }

    if (input.sku) {
        await ensureSkuUnique(
            input.sku,
            variantId
        );
    }

    const price =
        input.price ??
        Number(existing.price);

    const compareAtPrice =
        input.compareAtPrice !== undefined
            ? input.compareAtPrice
            : existing.compareAtPrice !== null
                ? Number(existing.compareAtPrice)
                : null;

    const costPrice =
        input.costPrice !== undefined
            ? input.costPrice
            : existing.costPrice !== null
                ? Number(existing.costPrice)
                : null;

    validatePricing(
        price,
        compareAtPrice,
        costPrice
    );

    const variant = await prisma.productVariant.update({
        where: {
            id: variantId,
        },

        data: {
            ...(input.name !== undefined && {
                name: input.name,
            }),

            ...(input.sku !== undefined && {
                sku: input.sku,
            }),

            ...(input.price !== undefined && {
                price: input.price,
            }),

            ...(input.compareAtPrice !==
                undefined && {
                compareAtPrice:
                    input.compareAtPrice,
            }),

            ...(input.costPrice !== undefined && {
                costPrice: input.costPrice,
            }),

            ...(input.status !== undefined && {
                status: input.status,
            }),
        },

        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },

            inventory: true,
        },
    });

    await createAuditLog({
        userId,
        action: "UPDATE",
        entity: "ProductVariant",
        entityId: variant.id,
        description: `Updated product variant "${variant.name ?? variant.sku}"`,
        metadata: {
            fields: Object.keys(input),
        },
    });

    return variant;
};

export const deleteProductVariant = async (
    productId: string,
    variantId: string,
    userId: string
) => {
    const variant =
        await prisma.productVariant.findFirst({
            where: {
                id: variantId,
                productId,
            },

            include: {
                _count: {
                    select: {
                        orderItems: true,
                    },
                },
            },
        });

    if (!variant) {
        throw new AppError(
            "Product variant not found",
            404
        );
    }

    if (variant._count.orderItems > 0) {
        throw new AppError(
            "Variant cannot be deleted because it has order history",
            409
        );
    }

    await prisma.productVariant.delete({
        where: {
            id: variantId,
        },
    });

    await createAuditLog({
        userId,
        action: "DELETE",
        entity: "ProductVariant",
        entityId: variant.id,
        description: `Deleted product variant "${variant.name ?? variant.sku}"`,
        metadata: {
            sku: variant.sku,
        },
    });
};