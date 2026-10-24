import { prisma } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog, createAuditLogTx } from "./auditLog.service.js";

const brandingSettingKeys = [
  "store.name",
  "store.logoUrl",
  "store.logoAltText",
] as const;

export type StoreBranding = {
  logoUrl: string;
  storeName: string;
  logoAltText: string;
};

const isHttpImageUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

const brandingFromSettings = (
  settings: { key: string; value: Prisma.JsonValue; isSensitive: boolean }[],
): StoreBranding => {
  const values = new Map(
    settings.map(({ key, value, isSensitive }) => [
      key,
      isSensitive ? null : value,
    ]),
  );
  const nameValue = values.get("store.name");
  const storeName =
    typeof nameValue === "string" && nameValue.trim()
      ? nameValue.trim()
      : "Store";
  const logoValue = values.get("store.logoUrl");
  const logoUrl =
    typeof logoValue === "string" &&
    logoValue.trim() &&
    isHttpImageUrl(logoValue.trim())
      ? logoValue.trim()
      : "";
  const altValue = values.get("store.logoAltText");

  return {
    logoUrl,
    storeName,
    logoAltText:
      typeof altValue === "string" && altValue.trim()
        ? altValue.trim()
        : storeName,
  };
};

export const getStoreBranding = async (): Promise<StoreBranding> => {
  const settings = await prisma.setting.findMany({
    where: { key: { in: [...brandingSettingKeys] } },
    select: { key: true, value: true, isSensitive: true },
  });

  return brandingFromSettings(settings);
};

export const saveStoreBranding = async (
  data: StoreBranding,
  userId: string,
): Promise<StoreBranding> => {
  const settings = [
    {
      key: "store.name",
      value: data.storeName.trim(),
      description: "Public store name",
    },
    {
      key: "store.logoUrl",
      value: data.logoUrl.trim(),
      description: "Public storefront logo image URL",
    },
    {
      key: "store.logoAltText",
      value: data.logoAltText.trim(),
      description: "Accessible description for the storefront logo",
    },
  ] as const;

  await prisma.$transaction(async (tx) => {
    for (const setting of settings) {
      await tx.setting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value as Prisma.InputJsonValue,
          category: "STORE",
          isSensitive: false,
          description: setting.description,
        },
        create: {
          key: setting.key,
          value: setting.value as Prisma.InputJsonValue,
          category: "STORE",
          isSensitive: false,
          description: setting.description,
        },
      });
    }

    await createAuditLogTx(tx, {
      userId,
      action: "UPDATE",
      entity: "StoreBranding",
      description: "Updated storefront branding settings",
      metadata: { keys: settings.map(({ key }) => key) },
    });
  });

  return {
    logoUrl: data.logoUrl.trim(),
    storeName: data.storeName.trim(),
    logoAltText: data.logoAltText.trim() || data.storeName.trim(),
  };
};

const sanitizeSetting = (setting: any) => ({
  ...setting,
  value: setting.isSensitive ? null : setting.value,
});

export const getSettings = async ({
  category,
  search,
  page = 1,
  limit = 20,
}: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const where = {
    ...(category ? { category: category as any } : {}),
    ...(search
      ? {
          OR: [
            {
              key: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [settings, total] = await Promise.all([
    prisma.setting.findMany({
      where,
      orderBy: {
        key: "asc",
      },
      skip,
      take: limit,
    }),

    prisma.setting.count({
      where,
    }),
  ]);

  return {
    settings: settings.map(sanitizeSetting),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSettingByKey = async (key: string) => {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  if (!setting) {
    throw new AppError("Setting not found", 404);
  }

  return sanitizeSetting(setting);
};

export const createSetting = async (
  data: {
    key: string;
    value: unknown;
    category: string;
    isSensitive?: boolean;
    description?: string;
  },
  userId: string
) => {
  const existing = await prisma.setting.findUnique({
    where: {
      key: data.key,
    },
  });

  if (existing) {
    throw new AppError("Setting with this key already exists", 409);
  }

  const setting = await prisma.setting.create({
    data: {
      key: data.key,
      value: data.value as any,
      category: data.category as any,
      isSensitive: data.isSensitive ?? false,
      description: data.description,
    },
    select: {
      id: true,
      key: true,
        value: true,
        category: true,
        isSensitive: true,
        description: true,
      },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "Setting",
    entityId: setting.id,
    description: `Created setting "${setting.key}"`,
    metadata: {
      key: setting.key,
      category: setting.category,
      isSensitive: setting.isSensitive,
    },
  });

  return sanitizeSetting(setting);
};

export const updateSetting = async (
  key: string,
  data: {
    value?: unknown;
    category?: string;
    isSensitive?: boolean;
    description?: string | null;
  },
  userId: string
) => {
  const existing = await prisma.setting.findUnique({
    where: { key },
  });

  if (!existing) {
    throw new AppError("Setting not found", 404);
  }

  const setting = await prisma.$transaction(async (tx) => {
    const updated = await tx.setting.update({
      where: { key },
      data: {
        ...(data.value !== undefined
          ? { value: data.value as any }
          : {}),
        ...(data.category !== undefined
          ? { category: data.category as any }
          : {}),
        ...(data.isSensitive !== undefined
          ? { isSensitive: data.isSensitive }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
      },
      select: {
        id: true,
        key: true,
        value: true,
        category: true,
        isSensitive: true,
        description: true,
      },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "UPDATE",
      entity: "Setting",
      entityId: updated.id,
      description: `Updated setting "${updated.key}"`,
      metadata: {
        key: updated.key,
        category: updated.category,
        isSensitive: updated.isSensitive,
      },
    });
    return updated;
  });

  return sanitizeSetting(setting);
};

export const deleteSetting = async (
  key: string,
  userId: string
) => {
  const existing = await prisma.setting.findUnique({
    where: { key },
    select: {
      id: true,
      key: true,
      category: true,
    },
  });

  if (!existing) {
    throw new AppError("Setting not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.setting.delete({
      where: { key },
    });

    await createAuditLogTx(tx, {
      userId,
      action: "DELETE",
      entity: "Setting",
      entityId: existing.id,
      description: `Deleted setting "${existing.key}"`,
      metadata: {
        key: existing.key,
        category: existing.category,
      },
    });
  });
};