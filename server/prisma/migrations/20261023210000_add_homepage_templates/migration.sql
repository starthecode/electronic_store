CREATE TABLE "HomepageSlide" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "buttonLabel" TEXT NOT NULL,
    "buttonUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSlide_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerTestimonial" (
    "id" UUID NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerRole" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "avatarUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTestimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomepageSlide_isActive_sortOrder_idx"
    ON "HomepageSlide"("isActive", "sortOrder");
CREATE INDEX "CustomerTestimonial_isActive_sortOrder_idx"
    ON "CustomerTestimonial"("isActive", "sortOrder");

INSERT INTO "Permission" ("id", "name", "description")
VALUES (gen_random_uuid(), 'homepage_templates.manage', 'Manage homepage slides and testimonials')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId")
SELECT gen_random_uuid(), r."id", p."id"
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'SUPER_ADMIN'
  AND p."name" = 'homepage_templates.manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
