import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

const ensureDiscountExists = async (
  discountId: string
) => {
  const discount =
    await prisma.discount.findUnique({
      where: {
        id: discountId,
      },
    });

  if (!discount) {
    throw new AppError(
      "Discount not found",
      404
    );
  }

  return discount;
};

export const getDiscountProducts = async (
  discountId: string
) => {
  await ensureDiscountExists(
    discountId
  );

  return prisma.discountProduct.findMany({
    where: {
      discountId,
    },

    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },

    orderBy: {
      id: "asc",
    },
  });
};

export const addDiscountProduct = async (
  discountId: string,
  productId: string
) => {
  const discount =
    await ensureDiscountExists(
      discountId
    );

  if (discount.scope !== "PRODUCT") {
    throw new AppError(
      "Products can only be assigned to a PRODUCT scope discount",
      400
    );
  }

  const product =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        id: true,
      },
    });

  if (!product) {
    throw new AppError(
      "Product not found",
      404
    );
  }

  const existing =
    await prisma.discountProduct.findFirst({
      where: {
        discountId,
        productId,
      },
    });

  if (existing) {
    throw new AppError(
      "Product is already assigned to this discount",
      409
    );
  }

  return prisma.discountProduct.create({
    data: {
      discountId,
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
    },
  });
};

export const removeDiscountProduct = async (
  discountId: string,
  productId: string
) => {
  const assignment =
    await prisma.discountProduct.findFirst({
      where: {
        discountId,
        productId,
      },
    });

  if (!assignment) {
    throw new AppError(
      "Product is not assigned to this discount",
      404
    );
  }

  await prisma.discountProduct.delete({
    where: {
      id: assignment.id,
    },
  });
};

export const getDiscountCategories =
  async (discountId: string) => {
    await ensureDiscountExists(
      discountId
    );

    return prisma.discountCategory.findMany({
      where: {
        discountId,
      },

      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },

      orderBy: {
        id: "asc",
      },
    });
  };

export const addDiscountCategory = async (
  discountId: string,
  categoryId: string
) => {
  const discount =
    await ensureDiscountExists(
      discountId
    );

  if (discount.scope !== "CATEGORY") {
    throw new AppError(
      "Categories can only be assigned to a CATEGORY scope discount",
      400
    );
  }

  const category =
    await prisma.category.findUnique({
      where: {
        id: categoryId,
      },

      select: {
        id: true,
      },
    });

  if (!category) {
    throw new AppError(
      "Category not found",
      404
    );
  }

  const existing =
    await prisma.discountCategory.findFirst({
      where: {
        discountId,
        categoryId,
      },
    });

  if (existing) {
    throw new AppError(
      "Category is already assigned to this discount",
      409
    );
  }

  return prisma.discountCategory.create({
    data: {
      discountId,
      categoryId,
    },

    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
};

export const removeDiscountCategory =
  async (
    discountId: string,
    categoryId: string
  ) => {
    const assignment =
      await prisma.discountCategory.findFirst({
        where: {
          discountId,
          categoryId,
        },
      });

    if (!assignment) {
      throw new AppError(
        "Category is not assigned to this discount",
        404
      );
    }

    await prisma.discountCategory.delete({
      where: {
        id: assignment.id,
      },
    });
  };