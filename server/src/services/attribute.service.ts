import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

interface CreateAttributeInput {
  name: string;
}

interface CreateAttributeValueInput {
  value: string;
}

const ensureAttributeExists = async (
  id: string
) => {
  const attribute =
    await prisma.attribute.findUnique({
      where: { id },
    });

  if (!attribute) {
    throw new AppError(
      "Attribute not found",
      404
    );
  }

  return attribute;
};

export const createAttribute = async (
  input: CreateAttributeInput,
  userId: string
) => {
  const existing =
    await prisma.attribute.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: "insensitive",
        },
      },
    });

  if (existing) {
    throw new AppError(
      "Attribute already exists",
      409
    );
  }

  const attribute = await prisma.attribute.create({
    data: {
      name: input.name,
    },

    include: {
      values: true,
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "Attribute",
    entityId: attribute.id,
    description: `Created attribute "${attribute.name}"`,
  });

  return attribute;
};

export const getAttributes = async () => {
  return prisma.attribute.findMany({
    orderBy: {
      name: "asc",
    },

    include: {
      values: {
        orderBy: {
          value: "asc",
        },
      },

      _count: {
        select: {
          values: true,
        },
      },
    },
  });
};

export const getAttributeById = async (
  id: string
) => {
  const attribute =
    await prisma.attribute.findUnique({
      where: { id },

      include: {
        values: {
          orderBy: {
            value: "asc",
          },

          include: {
            _count: {
              select: {
                variants: true,
              },
            },
          },
        },
      },
    });

  if (!attribute) {
    throw new AppError(
      "Attribute not found",
      404
    );
  }

  return attribute;
};

export const updateAttribute = async (
  id: string,
  input: CreateAttributeInput,
  userId: string
) => {
  await ensureAttributeExists(id);
  const existing =
    await prisma.attribute.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: "insensitive",
        },

        id: {
          not: id,
        },
      },
    });

  if (existing) {
    throw new AppError(
      "Attribute already exists",
      409
    );
  }

  const attribute = await prisma.attribute.update({
    where: { id },

    data: {
      name: input.name,
    },

    include: {
      values: true,
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "Attribute",
    entityId: attribute.id,
    description: `Updated attribute "${attribute.name}"`,
    metadata: {
      fields: Object.keys(input),
    },
  });

  return attribute;
};

export const deleteAttribute = async (
  id: string,
  userId: string
) => {
  await ensureAttributeExists(id);

  const attribute = await prisma.attribute.delete({
    where: { id },
  });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "Attribute",
    entityId: id,
    description: `Deleted attribute "${attribute.name}"`,
  });

};

export const createAttributeValue = async (
  attributeId: string,
  input: CreateAttributeValueInput
) => {
  await ensureAttributeExists(
    attributeId
  );

  const existing =
    await prisma.attributeValue.findFirst({
      where: {
        attributeId,
        value: {
          equals: input.value,
          mode: "insensitive",
        },
      },
    });

  if (existing) {
    throw new AppError(
      "Attribute value already exists",
      409
    );
  }

  return prisma.attributeValue.create({
    data: {
      attributeId,
      value: input.value,
    },
  });
};

export const updateAttributeValue = async (
  attributeId: string,
  valueId: string,
  input: CreateAttributeValueInput
) => {
  const existing =
    await prisma.attributeValue.findFirst({
      where: {
        id: valueId,
        attributeId,
      },
    });

  if (!existing) {
    throw new AppError(
      "Attribute value not found",
      404
    );
  }

  const duplicate =
    await prisma.attributeValue.findFirst({
      where: {
        attributeId,

        value: {
          equals: input.value,
          mode: "insensitive",
        },

        id: {
          not: valueId,
        },
      },
    });

  if (duplicate) {
    throw new AppError(
      "Attribute value already exists",
      409
    );
  }

  return prisma.attributeValue.update({
    where: {
      id: valueId,
    },

    data: {
      value: input.value,
    },
  });
};

export const deleteAttributeValue = async (
  attributeId: string,
  valueId: string
) => {
  const value =
    await prisma.attributeValue.findFirst({
      where: {
        id: valueId,
        attributeId,
      },

      include: {
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

  if (!value) {
    throw new AppError(
      "Attribute value not found",
      404
    );
  }

  if (value._count.variants > 0) {
    throw new AppError(
      "Attribute value cannot be deleted because it is assigned to product variants",
      409
    );
  }

  await prisma.attributeValue.delete({
    where: {
      id: valueId,
    },
  });
};