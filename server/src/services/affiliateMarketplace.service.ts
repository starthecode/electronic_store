import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

const marketplaceSelect = {
  id: true,
  name: true,
  code: true,
  logoUrl: true,
  baseUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: true,
    },
  },
} as const;

export const getAffiliateMarketplaces = async ({
  status,
  search,
}: {
  status?: "ACTIVE" | "INACTIVE";
  search?: string;
}) => {
  return prisma.affiliateMarketplace.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                code: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    select: marketplaceSelect,
    orderBy: {
      name: "asc",
    },
  });
};

export const getAffiliateMarketplaceById = async (
  id: string
) => {
  const marketplace =
    await prisma.affiliateMarketplace.findUnique({
      where: { id },
      select: marketplaceSelect,
    });

  if (!marketplace) {
    throw new AppError(
      "Affiliate marketplace not found",
      404
    );
  }

  return marketplace;
};

export const createAffiliateMarketplace = async (
  data: {
    name: string;
    code: string;
    logoUrl?: string;
    baseUrl?: string;
    status?: "ACTIVE" | "INACTIVE";
  },
  userId: string
) => {
  const code = data.code.trim().toUpperCase();

  const existing =
    await prisma.affiliateMarketplace.findUnique({
      where: { code },
    });

  if (existing) {
    throw new AppError(
      "An affiliate marketplace with this code already exists",
      409
    );
  }

  const marketplace =
    await prisma.affiliateMarketplace.create({
      data: {
        name: data.name.trim(),
        code,
        logoUrl: data.logoUrl,
        baseUrl: data.baseUrl,
        status: data.status ?? "ACTIVE",
      },
      select: marketplaceSelect,
    });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "AffiliateMarketplace",
    entityId: marketplace.id,
    description: `Created affiliate marketplace "${marketplace.name}"`,
    metadata: {
      name: marketplace.name,
      code: marketplace.code,
    },
  });

  return marketplace;
};

export const updateAffiliateMarketplace = async (
  id: string,
  data: {
    name?: string;
    code?: string;
    logoUrl?: string | null;
    baseUrl?: string | null;
    status?: "ACTIVE" | "INACTIVE";
  },
  userId: string
) => {
  const existing =
    await prisma.affiliateMarketplace.findUnique({
      where: { id },
    });

  if (!existing) {
    throw new AppError(
      "Affiliate marketplace not found",
      404
    );
  }

  const updateData: {
    name?: string;
    code?: string;
    logoUrl?: string | null;
    baseUrl?: string | null;
    status?: "ACTIVE" | "INACTIVE";
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }

  if (data.code !== undefined) {
    const code = data.code.trim().toUpperCase();

    if (code !== existing.code) {
      const duplicate =
        await prisma.affiliateMarketplace.findUnique({
          where: { code },
        });

      if (duplicate) {
        throw new AppError(
          "An affiliate marketplace with this code already exists",
          409
        );
      }
    }

    updateData.code = code;
  }

  if (data.logoUrl !== undefined) {
    updateData.logoUrl = data.logoUrl;
  }

  if (data.baseUrl !== undefined) {
    updateData.baseUrl = data.baseUrl;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  const marketplace =
    await prisma.affiliateMarketplace.update({
      where: { id },
      data: updateData,
      select: marketplaceSelect,
    });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "AffiliateMarketplace",
    entityId: marketplace.id,
    description: `Updated affiliate marketplace "${marketplace.name}"`,
    metadata: {
      oldName: existing.name,
      newName: marketplace.name,
      oldCode: existing.code,
      newCode: marketplace.code,
      oldStatus: existing.status,
      newStatus: marketplace.status,
    },
  });

  return marketplace;
};

export const deleteAffiliateMarketplace = async (
  id: string,
  userId: string
) => {
  const existing =
    await prisma.affiliateMarketplace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

  if (!existing) {
    throw new AppError(
      "Affiliate marketplace not found",
      404
    );
  }

  if (existing._count.products > 0) {
    throw new AppError(
      "Cannot delete a marketplace that has affiliate products",
      400
    );
  }

  await prisma.affiliateMarketplace.delete({
    where: { id },
  });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "AffiliateMarketplace",
    entityId: existing.id,
    description: `Deleted affiliate marketplace "${existing.name}"`,
    metadata: {
      name: existing.name,
      code: existing.code,
    },
  });

  return true;
};