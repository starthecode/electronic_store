import type { Request, Response, NextFunction } from "express";

export const publicCatalogCache = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
  );

  res.setHeader(
    "Vary",
    "Accept-Encoding",
  );

  next();
};