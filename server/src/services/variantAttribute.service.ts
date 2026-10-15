import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

const ensureVariantExists = async (
  productId: string,
  variantId: string
) => {
  const variant =
    await prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
      },
      select: {
        id: true,
        productId: true,
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

const ensureAttributeValueExists = async (
  attributeValueId: string
) => {
  const attributeValue =
    await prisma.attributeValue.findUnique({
      where: {
        id: attributeValueId,
      },

      include: {
        attribute: true,
      },
    });

  if (!attributeValue) {
    throw new AppError(
      "Attribute value not found",
      404
    );
  }

  return attributeValue;
};

export const getVariantAttributes = async (
  productId: string,
  variantId: string
) => {
  await ensureVariantExists(
    productId,
    variantId
  );

  return prisma.variantAttribute.findMany({
    where: {
      variantId,
    },

    include: {
      attributeValue: {
        include: {
          attribute: true,
        },
      },
    },

    orderBy: {
      id: "asc",
    },
  });
};

export const assignVariantAttribute = async (
  productId: string,
  variantId: string,
  attributeValueId: string
) => {
  await ensureVariantExists(
    productId,
    variantId
  );

  const attributeValue =
    await ensureAttributeValueExists(
      attributeValueId
    );

  const existing =
    await prisma.variantAttribute.findFirst({
      where: {
        variantId,
        attributeValueId,
      },
    });

  if (existing) {
    throw new AppError(
      "This attribute value is already assigned to the variant",
      409
    );
  }

  /*
   * A variant should not have two values
   * from the same attribute.
   *
   * Example:
   *
   * Color → Black
   * Color → White
   *
   * should not be allowed on the same variant.
   */

  const existingSameAttribute =
    await prisma.variantAttribute.findFirst({
      where: {
        variantId,

        attributeValue: {
          attributeId:
            attributeValue.attributeId,
        },
      },

      include: {
        attributeValue: {
          include: {
            attribute: true,
          },
        },
      },
    });

  if (existingSameAttribute) {
    throw new AppError(
      `Variant already has a value for the "${attributeValue.attribute.name}" attribute`,
      409
    );
  }

  return prisma.variantAttribute.create({
    data: {
      variantId,
      attributeValueId,
    },

    include: {
      attributeValue: {
        include: {
          attribute: true,
        },
      },

      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          productId: true,
        },
      },
    },
  });
};

export const removeVariantAttribute = async (
  productId: string,
  variantId: string,
  variantAttributeId: string
) => {
  await ensureVariantExists(
    productId,
    variantId
  );

  const variantAttribute =
    await prisma.variantAttribute.findFirst({
      where: {
        id: variantAttributeId,
        variantId,
      },
    });

  if (!variantAttribute) {
    throw new AppError(
      "Variant attribute not found",
      404
    );
  }

  await prisma.variantAttribute.delete({
    where: {
      id: variantAttributeId,
    },
  });
};