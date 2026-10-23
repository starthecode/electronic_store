import type { Request, Response } from "express";
import {
  getPublicHomepageSlides,
  getPublicTestimonials,
} from "../../services/homepageTemplate.service.js";
import { successResponse } from "../../utils/apiResponse.js";

export const listPublicHomepageSlides = async (
  _req: Request,
  res: Response
) =>
  successResponse(
    res,
    "Homepage slides fetched successfully",
    await getPublicHomepageSlides()
  );

export const listPublicTestimonials = async (
  _req: Request,
  res: Response
) =>
  successResponse(
    res,
    "Testimonials fetched successfully",
    await getPublicTestimonials()
  );
