import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { parseAffiliateImageUrls } from "../utils/affiliateImageUrls.js";
import { createAuditLog } from "./auditLog.service.js";

const affiliateProductSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  imageUrl: true,
  imageUrls: true,
  categoryId: true,
  brandId: true,
  marketplaceId: true,
  externalProductId: true,
  productUrl: true,
  affiliateUrl: true,
  displayPrice: true,
  status: true,
  createdAt: true,
  updatedAt: true,

  marketplace: {
    select: {
      id: true,
      name: true,
      code: true,
      logoUrl: true,
      baseUrl: true,
      status: true,
    },
  },

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
    },
  },
} as const;

const withAffiliateImages = <
  T extends { imageUrl: string | null; imageUrls: string[] }
>(
  product: T
) => {
  const imageUrls = parseAffiliateImageUrls(
    product.imageUrls,
    product.imageUrl
  );

  return {
    ...product,
    imageUrls,
    imageUrl: imageUrls[0] ?? null,
  };
};

export interface AffiliateProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  marketplaceId?: string;
  categoryId?: string;
  brandId?: string;
  status?: "ACTIVE" | "INACTIVE";
  sortBy?:
    | "name"
    | "displayPrice"
    | "createdAt"
    | "updatedAt";
  sortOrder?: "asc" | "desc";
}

const ensureMarketplace = async (
  marketplaceId: string
) => {
  const marketplace =
    await prisma.affiliateMarketplace.findUnique({
      where: {
        id: marketplaceId,
      },
    });

  if (!marketplace) {
    throw new AppError(
      "Affiliate marketplace not found",
      404
    );
  }

  if (marketplace.status !== "ACTIVE") {
    throw new AppError(
      "Affiliate marketplace is inactive",
      400
    );
  }

  return marketplace;
};

const ensureCategory = async (
  categoryId?: string | null
) => {
  if (!categoryId) return null;

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
};

const ensureBrand = async (
  brandId?: string | null
) => {
  if (!brandId) return null;

  const brand = await prisma.brand.findUnique({
    where: {
      id: brandId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  return brand;
};

export const getAffiliateProducts = async ({
  page = 1,
  limit = 20,
  search,
  marketplaceId,
  categoryId,
  brandId,
  status,
  sortBy = "createdAt",
  sortOrder = "desc",
}: AffiliateProductListParams) => {
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
              externalProductId: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(marketplaceId
      ? { marketplaceId }
      : {}),

    ...(categoryId
      ? { categoryId }
      : {}),

    ...(brandId
      ? { brandId }
      : {}),

    ...(status ? { status } : {}),
  };

  const [products, total] = await prisma.$transaction([
    prisma.affiliateProduct.findMany({
      where,
      select: affiliateProductSelect,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),

    prisma.affiliateProduct.count({
      where,
    }),
  ]);

  return {
    products: products.map(withAffiliateImages),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAffiliateProductById = async (
  id: string
) => {
  const product =
    await prisma.affiliateProduct.findUnique({
      where: {
        id,
      },
      select: affiliateProductSelect,
    });

  if (!product) {
    throw new AppError(
      "Affiliate product not found",
      404
    );
  }

  return withAffiliateImages(product);
};

export const createAffiliateProduct = async (
  data: {
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    imageUrl?: string;
    imageUrls?: string[];
    categoryId?: string;
    brandId?: string;
    marketplaceId: string;
    externalProductId?: string;
    productUrl?: string;
    affiliateUrl: string;
    displayPrice?: number;
    status?: "ACTIVE" | "INACTIVE";
  },
  userId: string
) => {
  await ensureMarketplace(data.marketplaceId);
  await ensureCategory(data.categoryId);
  await ensureBrand(data.brandId);
  const imageUrls = parseAffiliateImageUrls(
    data.imageUrls,
    data.imageUrl
  );

  const slug = data.slug.trim().toLowerCase();

  const existing =
    await prisma.affiliateProduct.findUnique({
      where: {
        slug,
      },
    });

  if (existing) {
    throw new AppError(
      "An affiliate product with this slug already exists",
      409
    );
  }

  const product =
    await prisma.affiliateProduct.create({
      data: {
        name: data.name.trim(),
        slug,
        shortDescription: data.shortDescription,
        description: data.description,
        imageUrl: imageUrls[0] ?? null,
        imageUrls,
        categoryId: data.categoryId,
        brandId: data.brandId,
        marketplaceId: data.marketplaceId,
        externalProductId:
          data.externalProductId,
        productUrl: data.productUrl,
        affiliateUrl: data.affiliateUrl,
        displayPrice: data.displayPrice,
        status: data.status ?? "ACTIVE",
      },
      select: affiliateProductSelect,
    });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "AffiliateProduct",
    entityId: product.id,
    description: `Created affiliate product "${product.name}"`,
    metadata: {
      name: product.name,
      slug: product.slug,
      marketplaceId: product.marketplaceId,
      marketplace: product.marketplace.name,
      status: product.status,
    },
  });

  return withAffiliateImages(product);
};

export const updateAffiliateProduct = async (
  id: string,
  data: {
    name?: string;
    slug?: string;
    shortDescription?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
    categoryId?: string | null;
    brandId?: string;
    marketplaceId?: string;
    externalProductId?: string | null;
    productUrl?: string | null;
    affiliateUrl?: string;
    displayPrice?: number | null;
  },
  userId: string
) => {
  const existing =
    await prisma.affiliateProduct.findUnique({
      where: {
        id,
      },
      select: {
        ...affiliateProductSelect,
      },
    });

  if (!existing) {
    throw new AppError(
      "Affiliate product not found",
      404
    );
  }

  if (data.marketplaceId !== undefined) {
    await ensureMarketplace(data.marketplaceId);
  }

  if (data.categoryId !== undefined) {
    await ensureCategory(data.categoryId);
  }

  if (data.brandId !== undefined) {
    await ensureBrand(data.brandId);
  }

  const updateData: {
    name?: string;
    slug?: string;
    shortDescription?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
    categoryId?: string | null;
    brandId?: string | null;
    marketplaceId?: string;
    externalProductId?: string | null;
    productUrl?: string | null;
    affiliateUrl?: string;
    displayPrice?: number | null;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }

  if (data.slug !== undefined) {
    const slug = data.slug.trim().toLowerCase();

    if (slug !== existing.slug) {
      const duplicate =
        await prisma.affiliateProduct.findUnique({
          where: {
            slug,
          },
        });

      if (duplicate) {
        throw new AppError(
          "An affiliate product with this slug already exists",
          409
        );
      }
    }

    updateData.slug = slug;
  }

  if (data.shortDescription !== undefined) {
    updateData.shortDescription =
      data.shortDescription;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.imageUrls !== undefined) {
    updateData.imageUrls = data.imageUrls.map((url) => url.trim());
    updateData.imageUrl = updateData.imageUrls[0] ?? null;
  } else if (data.imageUrl !== undefined) {
    updateData.imageUrls = parseAffiliateImageUrls(
      undefined,
      data.imageUrl
    );
    updateData.imageUrl = updateData.imageUrls[0] ?? null;
  }

  if (data.categoryId !== undefined) {
    updateData.categoryId = data.categoryId;
  }

  if (data.brandId !== undefined) {
    updateData.brandId = data.brandId;
  }

  if (data.marketplaceId !== undefined) {
    updateData.marketplaceId = data.marketplaceId;
  }

  if (data.externalProductId !== undefined) {
    updateData.externalProductId =
      data.externalProductId;
  }

  if (data.productUrl !== undefined) {
    updateData.productUrl = data.productUrl;
  }

  if (data.affiliateUrl !== undefined) {
    updateData.affiliateUrl = data.affiliateUrl;
  }

  if (data.displayPrice !== undefined) {
    updateData.displayPrice = data.displayPrice;
  }

  const product =
    await prisma.affiliateProduct.update({
      where: {
        id,
      },
      data: updateData,
      select: affiliateProductSelect,
    });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "AffiliateProduct",
    entityId: product.id,
    description: `Updated affiliate product "${product.name}"`,
    metadata: {
      fields: Object.keys(updateData),
    },
  });

  return withAffiliateImages(product);
};

export const updateAffiliateProductStatus =
  async (
    id: string,
    status: "ACTIVE" | "INACTIVE",
    userId: string
  ) => {
    const existing =
      await prisma.affiliateProduct.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

    if (!existing) {
      throw new AppError(
        "Affiliate product not found",
        404
      );
    }

    if (existing.status === status) {
      return existing;
    }

    const product =
      await prisma.affiliateProduct.update({
        where: {
          id,
        },
        data: {
          status,
        },
        select: affiliateProductSelect,
      });

    await createAuditLog({
      userId,
      action: "STATUS_CHANGE",
      entity: "AffiliateProduct",
      entityId: product.id,
      description: `Changed affiliate product status from "${existing.status}" to "${status}"`,
      metadata: {
        oldStatus: existing.status,
        newStatus: status,
      },
    });

    return withAffiliateImages(product);
  };

export const deleteAffiliateProduct = async (
  id: string,
  userId: string
) => {
  const existing =
    await prisma.affiliateProduct.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        marketplaceId: true,
      },
    });

  if (!existing) {
    throw new AppError(
      "Affiliate product not found",
      404
    );
  }

  await prisma.affiliateProduct.delete({
    where: {
      id,
    },
  });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "AffiliateProduct",
    entityId: existing.id,
    description: `Deleted affiliate product "${existing.name}"`,
    metadata: {
      name: existing.name,
      slug: existing.slug,
      marketplaceId: existing.marketplaceId,
    },
  });

  return true;
};