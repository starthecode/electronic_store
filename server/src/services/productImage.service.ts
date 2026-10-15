import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

const ensureProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

const ensureImage = async (
  productId: string,
  imageId: string
) => {
  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
      productId,
    },
  });

  if (!image) {
    throw new AppError("Product image not found", 404);
  }

  return image;
};

export const getProductImages = async (
  productId: string
) => {
  await ensureProduct(productId);

  return prisma.productImage.findMany({
    where: {
      productId,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
};

export const getProductImageById = async (
  productId: string,
  imageId: string
) => {
  await ensureProduct(productId);

  return ensureImage(productId, imageId);
};

export const createProductImage = async (
  productId: string,
  data: {
    url: string;
    altText?: string;
    sortOrder?: number;
    isPrimary?: boolean;
  },
  userId?: string
) => {
  await ensureProduct(productId);

  return prisma.$transaction(async (tx) => {
    const existingImageCount =
      await tx.productImage.count({
        where: {
          productId,
        },
      });

    const isPrimary = data.isPrimary ?? false;

    /*
     * If this is the first image, automatically make it
     * the primary image unless explicitly specified otherwise.
     */
    const shouldBePrimary =
      existingImageCount === 0 || isPrimary;

    if (shouldBePrimary) {
      await tx.productImage.updateMany({
        where: {
          productId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const image = await tx.productImage.create({
      data: {
        productId,
        url: data.url,
        altText: data.altText,
        sortOrder: data.sortOrder ?? existingImageCount,
        isPrimary: shouldBePrimary,
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entity: "ProductImage",
      entityId: image.id,
      description: `Added image to product`,
      metadata: {
        productId: image.productId,
        url: image.url,
        isPrimary: image.isPrimary,
      },
    });

    return image;
  });
};

export const updateProductImage = async (
  productId: string,
  imageId: string,
  data: {
    url?: string;
    altText?: string | null;
    sortOrder?: number;
    isPrimary?: boolean;
  },
  userId?: string
) => {
  await ensureProduct(productId);

  await ensureImage(productId, imageId);

  return prisma.$transaction(async (tx) => {
    if (data.isPrimary === true) {
      await tx.productImage.updateMany({
        where: {
          productId,
          id: {
            not: imageId,
          },
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }


    const image = await tx.productImage.update({
      where: {
        id: imageId,
      },
      data: {
        ...(data.url !== undefined && {
          url: data.url,
        }),

        ...(data.altText !== undefined && {
          altText: data.altText,
        }),

        ...(data.sortOrder !== undefined && {
          sortOrder: data.sortOrder,
        }),

        ...(data.isPrimary !== undefined && {
          isPrimary: data.isPrimary,
        }),
      },
    });

    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "ProductImage",
      entityId: image.id,
      description: `Updated product image`,
      metadata: {
        productId: image.productId,
        fields: Object.keys(data),
      },
    });

    return image;
  });
};

export const deleteProductImage = async (
  productId: string,
  imageId: string,
  userId?: string
) => {
  await ensureProduct(productId);

  const image = await ensureImage(productId, imageId);

  return prisma.$transaction(async (tx) => {
    await tx.productImage.delete({
      where: {
        id: imageId,
      },
    });

    /*
     * If the deleted image was primary, promote the first
     * remaining image to primary.
     */
    if (image.isPrimary) {
      const nextImage =
        await tx.productImage.findFirst({
          where: {
            productId,
          },
          orderBy: [
            {
              sortOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        });

      if (nextImage) {
        await tx.productImage.update({
          where: {
            id: nextImage.id,
          },
          data: {
            isPrimary: true,
          },
        });
      }
    }

    await createAuditLog({
      userId,
      action: "DELETE",
      entity: "ProductImage",
      entityId: imageId,
      description: `Deleted product image`,
    });

    return {
      id: image.id,
      url: image.url,
    };
  });
};