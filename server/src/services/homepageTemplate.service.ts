import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

const orderedBy = [
  { sortOrder: "asc" as const },
  { createdAt: "asc" as const },
];

export const getAdminHomepageSlides = () =>
  prisma.homepageSlide.findMany({ orderBy: orderedBy });

export const getPublicHomepageSlides = () =>
  prisma.homepageSlide.findMany({
    where: { isActive: true },
    select: {
      id: true,
      brandName: true,
      title: true,
      titleHighlight: true,
      description: true,
      featureBullets: true,
      specText: true,
      priceLabel: true,
      price: true,
      variantLabels: true,
      buttonLabel: true,
      buttonUrl: true,
      imageUrl: true,
      mobileImageUrl: true,
      backgroundImageUrl: true,
      backgroundColor: true,
      sortOrder: true,
    },
    orderBy: orderedBy,
  });

export const createHomepageSlide = async (
  data: {
    brandName?: string | null;
    title: string;
    titleHighlight?: string | null;
    description: string;
    featureBullets?: string[];
    specText?: string | null;
    priceLabel?: string | null;
    price?: string | null;
    variantLabels?: string[];
    buttonLabel: string;
    buttonUrl: string;
    imageUrl: string;
    mobileImageUrl?: string | null;
    backgroundImageUrl?: string | null;
    backgroundColor?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
  userId: string
) => {
  const slide = await prisma.homepageSlide.create({ data });
  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "HomepageSlide",
    entityId: slide.id,
    description: `Created homepage slide "${slide.title}"`,
  });
  return slide;
};

export const updateHomepageSlide = async (
  id: string,
  data: {
    brandName?: string | null;
    title?: string;
    titleHighlight?: string | null;
    description?: string;
    featureBullets?: string[];
    specText?: string | null;
    priceLabel?: string | null;
    price?: string | null;
    variantLabels?: string[];
    buttonLabel?: string;
    buttonUrl?: string;
    imageUrl?: string;
    mobileImageUrl?: string | null;
    backgroundImageUrl?: string | null;
    backgroundColor?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
  userId: string
) => {
  const existing = await prisma.homepageSlide.findUnique({ where: { id } });
  if (!existing) throw new AppError("Homepage slide not found", 404);

  const slide = await prisma.homepageSlide.update({
    where: { id },
    data,
  });
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "HomepageSlide",
    entityId: slide.id,
    description: `Updated homepage slide "${slide.title}"`,
    metadata: { fields: Object.keys(data) },
  });
  return slide;
};

export const deleteHomepageSlide = async (id: string, userId: string) => {
  const existing = await prisma.homepageSlide.findUnique({ where: { id } });
  if (!existing) throw new AppError("Homepage slide not found", 404);

  await prisma.homepageSlide.delete({ where: { id } });
  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "HomepageSlide",
    entityId: id,
    description: `Deleted homepage slide "${existing.title}"`,
  });
  return { id };
};

export const reorderHomepageSlides = async (
  ids: string[],
  userId: string
) => {
  const current = await prisma.homepageSlide.findMany({
    select: { id: true },
    orderBy: orderedBy,
  });
  if (
    current.length !== ids.length ||
    new Set(ids).size !== ids.length ||
    current.some(({ id }) => !ids.includes(id))
  ) {
    throw new AppError(
      "Reorder request must include every homepage slide exactly once",
      400
    );
  }

  await prisma.$transaction(
    ids.map((id, sortOrder) =>
      prisma.homepageSlide.update({
        where: { id },
        data: { sortOrder },
      })
    )
  );
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "HomepageSlide",
    description: "Reordered homepage slides",
    metadata: { ids },
  });
  return getAdminHomepageSlides();
};

export const getAdminTestimonials = () =>
  prisma.customerTestimonial.findMany({ orderBy: orderedBy });

export const getPublicTestimonials = () =>
  prisma.customerTestimonial.findMany({
    where: { isActive: true },
    select: {
      id: true,
      customerName: true,
      customerRole: true,
      text: true,
      rating: true,
      avatarUrl: true,
      sortOrder: true,
    },
    orderBy: orderedBy,
  });

export const createTestimonial = async (
  data: {
    customerName: string;
    customerRole: string;
    text: string;
    rating: number;
    avatarUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
  userId: string
) => {
  const testimonial = await prisma.customerTestimonial.create({ data });
  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "CustomerTestimonial",
    entityId: testimonial.id,
    description: `Created testimonial for "${testimonial.customerName}"`,
  });
  return testimonial;
};

export const updateTestimonial = async (
  id: string,
  data: {
    customerName?: string;
    customerRole?: string;
    text?: string;
    rating?: number;
    avatarUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
  userId: string
) => {
  const existing = await prisma.customerTestimonial.findUnique({ where: { id } });
  if (!existing) throw new AppError("Testimonial not found", 404);

  const testimonial = await prisma.customerTestimonial.update({
    where: { id },
    data,
  });
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "CustomerTestimonial",
    entityId: testimonial.id,
    description: `Updated testimonial for "${testimonial.customerName}"`,
    metadata: { fields: Object.keys(data) },
  });
  return testimonial;
};

export const deleteTestimonial = async (id: string, userId: string) => {
  const existing = await prisma.customerTestimonial.findUnique({ where: { id } });
  if (!existing) throw new AppError("Testimonial not found", 404);

  await prisma.customerTestimonial.delete({ where: { id } });
  await createAuditLog({
    userId,
    action: "DELETE",
    entity: "CustomerTestimonial",
    entityId: id,
    description: `Deleted testimonial for "${existing.customerName}"`,
  });
  return { id };
};

export const reorderTestimonials = async (
  ids: string[],
  userId: string
) => {
  const current = await prisma.customerTestimonial.findMany({
    select: { id: true },
    orderBy: orderedBy,
  });
  if (
    current.length !== ids.length ||
    new Set(ids).size !== ids.length ||
    current.some(({ id }) => !ids.includes(id))
  ) {
    throw new AppError(
      "Reorder request must include every testimonial exactly once",
      400
    );
  }

  await prisma.$transaction(
    ids.map((id, sortOrder) =>
      prisma.customerTestimonial.update({
        where: { id },
        data: { sortOrder },
      })
    )
  );
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "CustomerTestimonial",
    description: "Reordered customer testimonials",
    metadata: { ids },
  });
  return getAdminTestimonials();
};
