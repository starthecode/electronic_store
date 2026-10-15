import { prisma } from "../../config/database.js";

export const getStoreBrands = async () => {
  const brands = await prisma.brand.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return brands;
};