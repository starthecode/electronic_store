import { prisma } from "../../config/database.js";

export const getStoreCategories = async () => {
  const categories = await prisma.category.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      parentId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories;
};