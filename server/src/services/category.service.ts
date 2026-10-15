import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createSlug } from "../utils/slug.js";
import { createAuditLog } from "./auditLog.service.js";

interface CreateCategoryInput {
    name: string;
    slug?: string;
    description?: string | null;
    imageUrl?: string | null;
    status?: "ACTIVE" | "INACTIVE";
    parentId?: string | null;
}

interface UpdateCategoryInput {
    name?: string;
    slug?: string;
    description?: string | null;
    imageUrl?: string | null;
    status?: "ACTIVE" | "INACTIVE";
    parentId?: string | null;
}

const ensureUniqueSlug = async (
    slug: string,
    excludeId?: string
) => {
    const existing = await prisma.category.findFirst({
        where: {
            slug,
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
            "A category with this slug already exists",
            409
        );
    }
};

const ensureParentExists = async (
    parentId: string | null | undefined
) => {
    if (!parentId) {
        return;
    }

    const parent = await prisma.category.findUnique({
        where: {
            id: parentId,
        },
        select: {
            id: true,
        },
    });

    if (!parent) {
        throw new AppError(
            "Parent category not found",
            404
        );
    }
};

const ensureNoCircularParent = async (
    categoryId: string,
    parentId: string
) => {
    let currentId: string | null = parentId;

    while (currentId) {
        if (currentId === categoryId) {
            throw new AppError(
                "A category cannot be its own ancestor",
                400
            );
        }

        const current: {
            parentId: string | null;
        } | null = await prisma.category.findUnique({
            where: {
                id: currentId,
            },
            select: {
                parentId: true,
            },
        });

        currentId = current?.parentId ?? null;
    }
};

export const createCategory = async (
    input: CreateCategoryInput,
    userId: string
) => {
    const slug = createSlug(
        input.slug || input.name
    );

    if (!slug) {
        throw new AppError(
            "Unable to generate a valid category slug",
            400
        );
    }

    await ensureUniqueSlug(slug);
    await ensureParentExists(input.parentId);

    const category = await prisma.category.create({
        data: {
            name: input.name.trim(),
            slug,
            description: input.description ?? null,
            imageUrl: input.imageUrl ?? null,
            status: input.status ?? "ACTIVE",
            parentId: input.parentId ?? null,
        },
        include: {
            parent: {
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
        entity: "Category",
        entityId: category.id,
        description: `Created category "${category.name}"`,
        metadata: {
            name: category.name,
            slug: category.slug,
            parentId: category.parentId,
        },
    });

    return category;
};

export const getCategories = async ({
    page,
    limit,
    search,
    status,
    parentId,
}: {
    page: number;
    limit: number;
    search?: string;
    status?: "ACTIVE" | "INACTIVE";
    parentId?: string | null;
}) => {
    const skip = (page - 1) * limit;

    const where = {
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
                ],
            }
            : {}),

        ...(status
            ? {
                status,
            }
            : {}),

        ...(parentId !== undefined
            ? {
                parentId,
            }
            : {}),
    };

    const [categories, total] =
        await prisma.$transaction([
            prisma.category.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    name: "asc",
                },
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                    _count: {
                        select: {
                            children: true,
                            products: true,
                        },
                    },
                },
            }),

            prisma.category.count({
                where,
            }),
        ]);

    return {
        categories,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getCategoryById = async (
    id: string
) => {
    const category =
        await prisma.category.findUnique({
            where: {
                id,
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                children: {
                    orderBy: {
                        name: "asc",
                    },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        status: true,
                    },
                },
                _count: {
                    select: {
                        children: true,
                        products: true,
                    },
                },
            },
        });

    if (!category) {
        throw new AppError(
            "Category not found",
            404
        );
    }

    return category;
};

export const updateCategory = async (
    id: string,
    input: UpdateCategoryInput,
    userId: string
) => {
    const existing =
        await prisma.category.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                parentId: true,
                slug: true,
            },
        });

    if (!existing) {
        throw new AppError(
            "Category not found",
            404
        );
    }

    if (input.parentId === id) {
        throw new AppError(
            "A category cannot be its own parent",
            400
        );
    }

    await ensureParentExists(input.parentId);

    if (input.parentId) {
        await ensureNoCircularParent(
            id,
            input.parentId
        );
    }

    let slug = existing.slug;

    if (input.slug !== undefined) {
        slug = createSlug(input.slug);

        if (!slug) {
            throw new AppError(
                "Invalid category slug",
                400
            );
        }

        await ensureUniqueSlug(slug, id);
    } else if (input.name !== undefined) {
        slug = createSlug(input.name);

        await ensureUniqueSlug(slug, id);
    }

    const category = await prisma.category.update({
        where: {
            id,
        },
        data: {
            ...(input.name !== undefined
                ? {
                    name: input.name.trim(),
                }
                : {}),

            slug,

            ...(input.description !== undefined
                ? {
                    description:
                        input.description,
                }
                : {}),

            ...(input.imageUrl !== undefined
                ? {
                    imageUrl: input.imageUrl,
                }
                : {}),

            ...(input.status !== undefined
                ? {
                    status: input.status,
                }
                : {}),

            ...(input.parentId !== undefined
                ? {
                    parentId: input.parentId,
                }
                : {}),
        },
        include: {
            parent: {
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
        action: "UPDATE",
        entity: "Category",
        entityId: category.id,
        description: `Updated category "${category.name}"`,
        metadata: {
            fields: Object.keys(input),
        },
    });

    return category;
};

export const deleteCategory = async (
    id: string,
    userId: string
) => {
    const category =
        await prisma.category.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
            },
        });

    if (!category) {
        throw new AppError(
            "Category not found",
            404
        );
    }

    const [childrenCount, productsCount] =
        await Promise.all([
            prisma.category.count({
                where: {
                    parentId: id,
                },
            }),

            prisma.product.count({
                where: {
                    categoryId: id,
                },
            }),
        ]);

    if (childrenCount > 0) {
        throw new AppError(
            "Cannot delete a category that has child categories",
            409
        );
    }

    if (productsCount > 0) {
        throw new AppError(
            "Cannot delete a category that has products",
            409
        );
    }

    await prisma.category.delete({
        where: {
            id,
        },
    });

    await createAuditLog({
        userId,
        action: "DELETE",
        entity: "Category",
        entityId: id,
        description: `Deleted category "${category.name}"`,
    });
};