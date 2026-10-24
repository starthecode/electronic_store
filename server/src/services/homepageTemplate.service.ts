import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./auditLog.service.js";

const orderedBy = [
  { sortOrder: "asc" as const },
  { createdAt: "asc" as const },
];

const slideFields = {
  id: true,
  title: true,
  description: true,
  buttonLabel: true,
  buttonUrl: true,
  imageUrl: true,
  mobileImageUrl: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const getAdminHomepageSlides = () =>
  prisma.homepageSlide.findMany({
    select: slideFields,
    orderBy: orderedBy,
  });

export const getPublicHomepageSlides = () =>
  prisma.homepageSlide.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      buttonLabel: true,
      buttonUrl: true,
      imageUrl: true,
      mobileImageUrl: true,
      sortOrder: true,
    },
    orderBy: orderedBy,
  });

export const createHomepageSlide = async (
  data: {
    title: string;
    description?: string;
    buttonLabel?: string;
    buttonUrl?: string;
    imageUrl: string;
    mobileImageUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
  userId: string
) => {
  const slide = await prisma.homepageSlide.create({
    data: {
      title: data.title,
      description: data.description ?? "",
      buttonLabel: data.buttonLabel ?? "",
      buttonUrl: data.buttonUrl ?? "",
      imageUrl: data.imageUrl,
      ...(data.mobileImageUrl !== undefined
        ? { mobileImageUrl: data.mobileImageUrl }
        : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
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
    title?: string;
    description?: string;
    buttonLabel?: string;
    buttonUrl?: string;
    imageUrl?: string;
    mobileImageUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
  userId: string
) => {
  const existing = await prisma.homepageSlide.findUnique({ where: { id } });
  if (!existing) throw new AppError("Homepage slide not found", 404);

  const slideData = {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.buttonLabel !== undefined ? { buttonLabel: data.buttonLabel } : {}),
    ...(data.buttonUrl !== undefined ? { buttonUrl: data.buttonUrl } : {}),
    ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
    ...(data.mobileImageUrl !== undefined
      ? { mobileImageUrl: data.mobileImageUrl }
      : {}),
    ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
  };
  const slide = await prisma.homepageSlide.update({
    where: { id },
    data: slideData,
  });
  await createAuditLog({
    userId,
    action: "UPDATE",
    entity: "HomepageSlide",
    entityId: slide.id,
    description: `Updated homepage slide "${slide.title}"`,
    metadata: { fields: Object.keys(slideData) },
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
