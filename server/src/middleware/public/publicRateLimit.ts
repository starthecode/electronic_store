import rateLimit from "express-rate-limit";

export const publicCatalogRateLimit = rateLimit({
  windowMs: 60 * 1000,

  max: 120,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many catalog requests. Please try again shortly.",
  },

  skip: (req) => {
    return req.method !== "GET";
  },
});