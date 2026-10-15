import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

import {
  createAuditLog,
  createAuditLogTx,
} from "./auditLog.service.js";

const ensureGroup = async (groupId: string) => {
  const group = await prisma.specificationGroup.findUnique({
    where: {
      id: groupId,
    },
  });

  if (!group) {
    throw new AppError("Specification group not found", 404);
  }

  return group;
};

const ensureSpecification = async (
  specificationId: string
) => {
  const specification =
    await prisma.specification.findUnique({
      where: {
        id: specificationId,
      },
      include: {
        group: true,
      },
    });

  if (!specification) {
    throw new AppError("Specification not found", 404);
  }

  return specification;
};

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

/* ---------------- GROUPS ---------------- */

export const getSpecificationGroups = async () => {
  return prisma.specificationGroup.findMany({
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      specifications: {
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: {
          specifications: true,
        },
      },
    },
  });
};

export const getSpecificationGroupById = async (
  groupId: string
) => {
  return prisma.specificationGroup.findUnique({
    where: {
      id: groupId,
    },
    include: {
      specifications: {
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: {
          specifications: true,
        },
      },
    },
  }).then((group) => {
    if (!group) {
      throw new AppError(
        "Specification group not found",
        404
      );
    }

    return group;
  });
};

export const createSpecificationGroup = async (data: {
  name: string;
  sortOrder?: number;
}, userId: string) => {
  const existing =
    await prisma.specificationGroup.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: "insensitive",
        },
      },
    });

  if (existing) {
    throw new AppError(
      "Specification group already exists",
      409
    );
  }

  const group = await prisma.specificationGroup.create({
    data: {
      name: data.name,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "SpecificationGroup",
    entityId: group.id,
    description: `Created specification group "${group.name}"`,
    metadata: {
      name: group.name,
      sortOrder: group.sortOrder,
    },
  });

  return group;
};

export const updateSpecificationGroup = async (
  groupId: string,
  data: {
    name?: string;
    sortOrder?: number;
  },
  userId: string
) => {
  await ensureGroup(groupId);

  if (data.name) {
    const existing =
      await prisma.specificationGroup.findFirst({
        where: {
          id: {
            not: groupId,
          },
          name: {
            equals: data.name,
            mode: "insensitive",
          },
        },
      });

    if (existing) {
      throw new AppError(
        "Specification group already exists",
        409
      );
    }
  }

  const updatedGroup = await prisma.specificationGroup.update({
    where: {
      id: groupId,
    },
    data,
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "SpecificationGroup",
    entityId: updatedGroup.id,
    description: `Updated specification group "${updatedGroup.name}"`,
    metadata: {
      fields: Object.keys(data),
      name: data.name ?? null,
      sortOrder: data.sortOrder ?? null,
    },
  });

  return updatedGroup;
};

export const deleteSpecificationGroup = async (
  groupId: string, userId: string
) => {
  await ensureGroup(groupId);
  const specificationCount =
    await prisma.specification.count({
      where: {
        groupId,
      },
    });

  if (specificationCount > 0) {
    throw new AppError(
      "Cannot delete specification group while specifications exist",
      409
    );
  }

  const deletedGroup = await prisma.specificationGroup.delete({
    where: {
      id: groupId,
    },
  });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "SpecificationGroup",
    entityId: deletedGroup.id,
    description: `Deleted specification group "${deletedGroup.name}"`,
    metadata: {
      name: deletedGroup.name,
      sortOrder: deletedGroup.sortOrder,
    },
  });


  return deletedGroup;

};

/* ---------------- SPECIFICATIONS ---------------- */

export const getSpecifications = async (
  groupId: string
) => {
  await ensureGroup(groupId);

  return prisma.specification.findMany({
    where: {
      groupId,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      group: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });
};

export const getSpecificationById = async (
  specificationId: string
) => {
  return ensureSpecification(specificationId);
};

export const createSpecification = async (
  groupId: string,
  data: {
    name: string;
  },
  userId: string
) => {
  await ensureGroup(groupId);

  const existing =
    await prisma.specification.findFirst({
      where: {
        groupId,
        name: {
          equals: data.name,
          mode: "insensitive",
        },
      },
    });

  if (existing) {
    throw new AppError(
      "Specification already exists in this group",
      409
    );
  }

  const specification =
    await prisma.specification.create({
      data: {
        groupId,
        name: data.name,
      },
      include: {
        group: true,
      },
    });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "Specification",
    entityId: specification.id,
    description: `Created specification "${specification.name}"`,
    metadata: {
      name: specification.name,
      groupId: specification.groupId,
      groupName: specification.group.name,
    },
  });

  return specification;
};

export const updateSpecification = async (
  specificationId: string,
  data: {
    name: string;
  },
  userId: string
) => {
  const specification =
    await ensureSpecification(specificationId);

  const existing =
    await prisma.specification.findFirst({
      where: {
        groupId: specification.groupId,
        id: {
          not: specificationId,
        },
        name: {
          equals: data.name,
          mode: "insensitive",
        },
      },
    });

  if (existing) {
    throw new AppError(
      "Specification already exists in this group",
      409
    );
  }

  const updatedSpecification =
    await prisma.specification.update({
      where: {
        id: specificationId,
      },
      data: {
        name: data.name,
      },
      include: {
        group: true,
      },
    });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "Specification",
    entityId: updatedSpecification.id,
    description: `Updated specification "${updatedSpecification.name}"`,
    metadata: {
      fields: Object.keys(data),
      name: data.name,
      groupId: updatedSpecification.groupId,
      groupName: updatedSpecification.group.name,
    },
  });

  return updatedSpecification;
};

export const deleteSpecification = async (
  specificationId: string, userId: string
) => {
  const specification = await ensureSpecification(specificationId);

  const productCount =
    await prisma.productSpecification.count({
      where: {
        specificationId,
      },
    });

  if (productCount > 0) {
    throw new AppError(
      "Cannot delete specification while it is assigned to products",
      409
    );
  }

  const deletedSpecification =
    await prisma.specification.delete({
      where: {
        id: specificationId,
      },
    });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "Specification",
    entityId: deletedSpecification.id,
    description: `Deleted specification "${deletedSpecification.name}"`,
    metadata: {
      name: deletedSpecification.name,
      groupId: specification.groupId,
      groupName: specification.group.name,
    },
  });

  return deletedSpecification;
};

/* ---------------- PRODUCT SPECIFICATIONS ---------------- */

export const getProductSpecifications = async (
  productId: string
) => {
  await ensureProduct(productId);

  return prisma.productSpecification.findMany({
    where: {
      productId,
    },
    orderBy: [
      {
        specification: {
          group: {
            sortOrder: "asc",
          },
        },
      },
      {
        specification: {
          name: "asc",
        },
      },
    ],
    include: {
      specification: {
        include: {
          group: true,
        },
      },
    },
  });
};

export const createProductSpecification = async (
  productId: string,
  data: {
    specificationId: string;
    value: string;
  },
  userId: string
) => {
  await ensureProduct(productId);

  await ensureSpecification(data.specificationId);

  const existing =
    await prisma.productSpecification.findUnique({
      where: {
        productId_specificationId: {
          productId,
          specificationId: data.specificationId,
        },
      },
    });

  if (existing) {
    throw new AppError(
      "This specification is already assigned to the product",
      409
    );
  }

  const productSpecification =
    await prisma.productSpecification.create({
      data: {
        productId,
        specificationId: data.specificationId,
        value: data.value,
      },
      include: {
        specification: {
          include: {
            group: true,
          },
        },
      },
    });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "ProductSpecification",
    entityId: productSpecification.id,
    description: `Assigned specification "${productSpecification.specification.name}" to product`,
    metadata: {
      productId,
      specificationId: data.specificationId,
      specificationName:
        productSpecification.specification.name,
      groupId:
        productSpecification.specification.group.id,
      groupName:
        productSpecification.specification.group.name,
      value: data.value,
    },
  });

  return productSpecification;
};

export const updateProductSpecification = async (
  productId: string,
  productSpecificationId: string,
  data: {
    value: string;
  },
  userId: string
) => {
  await ensureProduct(productId);

  const productSpecification =
    await prisma.productSpecification.findFirst({
      where: {
        id: productSpecificationId,
        productId,
      },
    });

  if (!productSpecification) {
    throw new AppError(
      "Product specification not found",
      404
    );
  }

  const updatedProductSpecification =
    await prisma.productSpecification.update({
      where: {
        id: productSpecificationId,
      },
      data: {
        value: data.value,
      },
      include: {
        specification: {
          include: {
            group: true,
          },
        },
      },
    });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "ProductSpecification",
    entityId: updatedProductSpecification.id,
    description: `Updated product specification "${updatedProductSpecification.specification.name}"`,
    metadata: {
      productId,
      specificationId:
        updatedProductSpecification.specificationId,
      specificationName:
        updatedProductSpecification.specification.name,
      groupName:
        updatedProductSpecification.specification.group.name,
      value: data.value,
    },
  });

  return updatedProductSpecification;
};

export const deleteProductSpecification = async (
  productId: string,
  productSpecificationId: string,
  userId: string
) => {
  await ensureProduct(productId);

  const productSpecification =
    await prisma.productSpecification.findFirst({
      where: {
        id: productSpecificationId,
        productId,
      },
      include: {
        specification: {
          include: {
            group: true,
          },
        },
      },
    });

  if (!productSpecification) {
    throw new AppError(
      "Product specification not found",
      404
    );
  }

  const deletedProductSpecification =
    await prisma.productSpecification.delete({
      where: {
        id: productSpecificationId,
      },
    });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "ProductSpecification",
    entityId: deletedProductSpecification.id,
    description: `Removed specification "${productSpecification.specification.name}" from product`,
    metadata: {
      productId,
      specificationId:
        productSpecification.specificationId,
      specificationName:
        productSpecification.specification.name,
      groupName:
        productSpecification.specification.group.name,
      value: productSpecification.value,
    },
  });

  return deletedProductSpecification;
};