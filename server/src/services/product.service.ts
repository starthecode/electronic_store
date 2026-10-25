import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createSlug } from "../utils/slug.js";
import {
  createAuditLog,
  createAuditLogTx,
} from "./auditLog.service.js";

interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  categoryId: string;
  brandId?: string | null;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  categoryId?: string;
  brandId?: string | null;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

interface ListProductsInput {
  page: number;
  limit: number;
  search?: string;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: "createdAt" | "name" | "updatedAt";
  sortOrder: "asc" | "desc";
}

const ensureUniqueSlug = async (
  slug: string,
  excludeId?: string
) => {
  const existing = await prisma.product.findFirst({
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
    throw new AppError("Product slug already exists", 409);
  }
};

const ensureCategoryExists = async (
  categoryId: string
) => {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
};

const ensureBrandExists = async (
  brandId?: string | null
) => {
  if (!brandId) {
    return null;
  }

  const brand = await prisma.brand.findUnique({
    where: {
      id: brandId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  return brand;
};

export const createProduct = async (
  input: CreateProductInput,
  userId: string
) => {
  await ensureCategoryExists(input.categoryId);

  await ensureBrandExists(input.brandId);

  const slug = input.slug
    ? createSlug(input.slug)
    : createSlug(input.name);

  if (!slug) {
    throw new AppError(
      "Unable to generate a valid product slug",
      400
    );
  }

  await ensureUniqueSlug(slug);


  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      shortDescription: input.shortDescription ?? null,
      categoryId: input.categoryId,
      brandId: input.brandId ?? null,
      status: input.status ?? "DRAFT",
    },

    include: {
      category: true,
      brand: true,
    },

  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "Product",
    entityId: product.id,
    description: `Created product "${product.name}"`,
    metadata: {
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId,
      brandId: product.brandId,
      status: product.status,
    },
  });

  return product;


};

export const getProducts = async ({
  page,
  limit,
  search,
  status,
  categoryId,
  brandId,
  minPrice,
  maxPrice,
  sortBy,
  sortOrder,
}: ListProductsInput) => {
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
            {
              variants: {
                some: {
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

    ...(status ? { status } : {}),

    ...(categoryId ? { categoryId } : {}),

    ...(brandId ? { brandId } : {}),

    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          variants: {
            some: {
              price: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            },
          },
        }
      : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,

      orderBy: {
        [sortBy]: sortOrder,
      },

      skip,
      take: limit,

      include: {
        category: true,
        brand: true,

        _count: {
          select: {
            variants: true,
            images: true,
          },
        },
      },
    }),

    prisma.product.count({
      where,
    }),
  ]);

  return {
    products,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (
  id: string
) => {
  const product =
    await prisma.product.findUnique({
      where: {
        id,
      },

      include: {
        category: true,
        brand: true,

        variants: {
          orderBy: {
            createdAt: "asc",
          },
        },

        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        specifications: {
          include: {
            specification: {
              include: {
                group: true,
              },
            },
          },
        },

        _count: {
          select: {
            variants: true,
            images: true,
          },
        },
      },
    });

  if (!product) {
    throw new AppError(
      "Product not found",
      404
    );
  }

  return product;
};

export const updateProduct = async (
  id: string,
  input: UpdateProductInput,
  userId: string
) => {
  const existing =
    await prisma.product.findUnique({
      where: {
        id,
      },

      select: {
        slug: true,
      },
    });

  if (!existing) {
    throw new AppError(
      "Product not found",
      404
    );
  }

  if (input.categoryId) {
    await ensureCategoryExists(
      input.categoryId
    );
  }

  if (input.brandId !== undefined) {
    await ensureBrandExists(
      input.brandId
    );
  }

  if (input.name) {
    const duplicateName =
      await prisma.product.findFirst({
        where: {
          name: {
            equals: input.name,
            mode: "insensitive",
          },

          id: {
            not: id,
          },
        },

        select: {
          id: true,
        },
      });

    if (duplicateName) {
      throw new AppError(
        "Product name already exists",
        409
      );
    }
  }

  let slug = existing.slug;

  if (input.slug) {
    slug = createSlug(input.slug);
  } else if (input.name) {
    slug = createSlug(input.name);
  }

  if (!slug) {
    throw new AppError(
      "Unable to generate a valid product slug",
      400
    );
  }

  await ensureUniqueSlug(slug, id);

  const product = await prisma.product.update({
    where: {
      id,
    },

    data: {
      ...(input.name !== undefined && {
        name: input.name,
      }),

      slug,

      ...(input.description !==
        undefined && {
        description:
          input.description,
      }),

      ...(input.shortDescription !==
        undefined && {
        shortDescription:
          input.shortDescription,
      }),
      ...(input.categoryId !==
        undefined && {
        categoryId:
          input.categoryId,
      }),

      ...(input.brandId !== undefined && {
        brandId: input.brandId,
      }),

      ...(input.status !== undefined && {
        status: input.status,
      }),

    },

    include: {
      category: true,
      brand: true,
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "Product",
    entityId: product.id,
    description: `Updated product "${product.name}"`,
    metadata: {
      fields: Object.keys(input),
    },
  });

  return product;
};

export const deleteProduct = async (
  id: string,
  userId: string
) => {
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const orderItemCount = await tx.orderItem.count({
      where: {
        variant: {
          is: { productId: id },
        },
      },
    });

    if (orderItemCount > 0) {
      throw new AppError(
        "Product cannot be deleted because it has order history",
        409
      );
    }

    const inventoryTransactionCount =
      await tx.inventoryTransaction.count({
        where: {
          variant: {
            is: { productId: id },
          },
        },
      });

    if (inventoryTransactionCount > 0) {
      throw new AppError(
        "Product cannot be deleted because it has inventory transaction history",
        409
      );
    }

    await tx.product.delete({ where: { id } });
    await createAuditLogTx(tx, {
      userId,
      action: "DELETE",
      entity: "Product",
      entityId: id,
      description: `Deleted product "${product.name}"`,
    });
  }, { isolationLevel: "Serializable" });
};
