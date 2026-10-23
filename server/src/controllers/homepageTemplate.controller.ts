import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { Response } from "express";
import {
  createHomepageSlide,
  createTestimonial,
  deleteHomepageSlide,
  deleteTestimonial,
  getAdminHomepageSlides,
  getAdminTestimonials,
  reorderHomepageSlides,
  reorderTestimonials,
  updateHomepageSlide,
  updateTestimonial,
} from "../services/homepageTemplate.service.js";
import { successResponse } from "../utils/apiResponse.js";

const userId = (req: AuthenticatedRequest) =>
  String(req.user?.userId);

export const listAdminSlides = async (
  _req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Homepage slides fetched successfully",
    await getAdminHomepageSlides()
  );

export const createSlide = async (
  req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Homepage slide created successfully",
    await createHomepageSlide(req.body, userId(req)),
    201
  );

export const updateSlide = async (
  req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Homepage slide updated successfully",
    await updateHomepageSlide(
      String(req.params.id),
      req.body,
      userId(req)
    )
  );

export const deleteSlide = async (
  req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Homepage slide deleted successfully",
    await deleteHomepageSlide(String(req.params.id), userId(req))
  );

export const reorderSlides = async (
  req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Homepage slides reordered successfully",
    await reorderHomepageSlides(req.body.ids, userId(req))
  );

export const listAdminTestimonials = async (
  _req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Testimonials fetched successfully",
    await getAdminTestimonials()
  );

export const createCustomerTestimonial = async (
  req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Testimonial created successfully",
    await createTestimonial(req.body, userId(req)),
    201
  );

export const updateCustomerTestimonial = async (
  req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Testimonial updated successfully",
    await updateTestimonial(
      String(req.params.id),
      req.body,
      userId(req)
    )
  );

export const deleteCustomerTestimonial = async (
  req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Testimonial deleted successfully",
    await deleteTestimonial(String(req.params.id), userId(req))
  );

export const reorderCustomerTestimonials = async (
  req: AuthenticatedRequest,
  res: Response
) =>
  successResponse(
    res,
    "Testimonials reordered successfully",
    await reorderTestimonials(req.body.ids, userId(req))
  );
