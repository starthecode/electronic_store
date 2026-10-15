import type { Request, Response } from "express";

import { successResponse } from "../../utils/apiResponse.js";
import { registerCustomer } from "../../services/public/auth.service.js";
import { generateToken } from "../../utils/jwt.js";

export const register = async (req: Request, res: Response) => {
  const user = await registerCustomer(req.body);

  const token = generateToken({ userId: user.id, roleId: user.role.id, roleName: user.role.name });
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, "Account created successfully", { user }, 201);
};
