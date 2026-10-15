import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createSlug } from "../utils/slug.js";
import { createAuditLog } from "./auditLog.service.js";

interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

interface UpdateBrandInput {
  name?: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

interface ListBrandsInput {
  page: number;
  limit: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
}

const ensureUniqueSlug = async (
  slug: string,
  excludeId?: string
): Promise<void> => {
  const existingBrand = await prisma.brand.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (existingBrand) {
    throw new AppError("Brand slug already exists", 409);
  }
};

export const createBrand = async (input: CreateBrandInput, userId: string) => {
  const slug = input.slug
    ? createSlug(input.slug)
    : createSlug(input.name);

  if (!slug) {
    throw new AppError("Unable to generate a valid brand slug", 400);
  }

  await ensureUniqueSlug(slug);

  const existingName = await prisma.brand.findFirst({
    where: {
      name: {
        equals: input.name,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (existingName) {
    throw new AppError("Brand name already exists", 409);
  }

  const brand = await prisma.brand.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      logoUrl: input.logoUrl ?? null,
      status: input.status ?? "ACTIVE",
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "Brand",
    entityId: brand.id,
    description: `Created brand "${brand.name}"`,
    metadata: {
      name: brand.name,
      slug: brand.slug,
    },
  });

  return brand;
};

export const getBrands = async ({
  page,
  limit,
  search,
  status,
}: ListBrandsInput) => {
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
    ...(status ? { status } : {}),
  };

  const [brands, total] = await prisma.$transaction([
    prisma.brand.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
    prisma.brand.count({ where }),
  ]);

  return {
    brands,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBrandById = async (id: string) => {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  return brand;
};

export const updateBrand = async (
  id: string,
  input: UpdateBrandInput,
  userId: string
) => {
  const existingBrand = await prisma.brand.findUnique({
    where: { id },
  });

  if (!existingBrand) {
    throw new AppError("Brand not found", 404);
  }

  if (input.name && input.name !== existingBrand.name) {
    const duplicateName = await prisma.brand.findFirst({
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
      throw new AppError("Brand name already exists", 409);
    }
  }

  let slug = existingBrand.slug;

  if (input.slug) {
    slug = createSlug(input.slug);
  } else if (input.name) {
    slug = createSlug(input.name);
  }

  if (!slug) {
    throw new AppError("Unable to generate a valid brand slug", 400);
  }

  await ensureUniqueSlug(slug, id);

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      slug,
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.logoUrl !== undefined && {
        logoUrl: input.logoUrl,
      }),
      ...(input.status !== undefined && {
        status: input.status,
      }),
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "Brand",
    entityId: brand.id,
    description: `Updated brand "${brand.name}"`,
    metadata: {
      fields: Object.keys(input),
    },
  });

  return brand;
};

export const deleteBrand = async (id: string, userId: string) => {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!brand) {
    throw new AppError("Brand not found", 404);
  }

  if (brand._count.products > 0) {
    throw new AppError(
      "Brand cannot be deleted because products are associated with it",
      409
    );
  }

  await prisma.brand.delete({
    where: { id },
  });

  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "Brand",
    entityId: id,
    description: `Deleted brand "${brand.name}"`,
  });
};