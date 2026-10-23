import { Router } from "express";
import {
  createCustomerTestimonial,
  createSlide,
  deleteCustomerTestimonial,
  deleteSlide,
  listAdminSlides,
  listAdminTestimonials,
  reorderCustomerTestimonials,
  reorderSlides,
  updateCustomerTestimonial,
  updateSlide,
} from "../controllers/homepageTemplate.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createHomepageSlideSchema,
  createTestimonialSchema,
  deleteHomepageSlideSchema,
  deleteTestimonialSchema,
  listHomepageTemplatesSchema,
  reorderHomepageSlidesSchema,
  reorderTestimonialsSchema,
  updateHomepageSlideSchema,
  updateTestimonialSchema,
} from "../validators/homepageTemplate.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requirePermission("homepage_templates.manage"));

router.get("/slides", validate(listHomepageTemplatesSchema), asyncHandler(listAdminSlides));
router.post("/slides", validate(createHomepageSlideSchema), asyncHandler(createSlide));
router.patch("/slides/reorder", validate(reorderHomepageSlidesSchema), asyncHandler(reorderSlides));
router.patch("/slides/:id", validate(updateHomepageSlideSchema), asyncHandler(updateSlide));
router.delete("/slides/:id", validate(deleteHomepageSlideSchema), asyncHandler(deleteSlide));

router.get("/testimonials", validate(listHomepageTemplatesSchema), asyncHandler(listAdminTestimonials));
router.post("/testimonials", validate(createTestimonialSchema), asyncHandler(createCustomerTestimonial));
router.patch("/testimonials/reorder", validate(reorderTestimonialsSchema), asyncHandler(reorderCustomerTestimonials));
router.patch("/testimonials/:id", validate(updateTestimonialSchema), asyncHandler(updateCustomerTestimonial));
router.delete("/testimonials/:id", validate(deleteTestimonialSchema), asyncHandler(deleteCustomerTestimonial));

export default router;
