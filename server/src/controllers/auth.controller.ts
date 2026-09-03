import type { Request, Response } from "express";

import { prisma } from "../config/database.js";
import { comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";

export const login = async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(
      "Email and password are required",
      400
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new AppError(
      "Invalid email or password",
      401
    );
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(
      "Your account is not active",
      403
    );
  }

  const passwordValid = await comparePassword(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new AppError(
      "Invalid email or password",
      401
    );
  }

  const token = generateToken({
    userId: user.id,
    roleId: user.roleId,
  });

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      description: "User logged in",
    },
  });

  return successResponse(res, "Login successful", {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    },
  });
};

export const me = async (
  req: Request,
  res: Response
) => {
  const authReq = req as Request & {
    user?: {
      userId: string;
    };
  };

  if (!authReq.user) {
    throw new AppError(
      "Authentication required",
      401
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: authReq.user.userId,
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new AppError(
      "User not found",
      401
    );
  }

  return successResponse(res, "Authenticated user", {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    role: {
      id: user.role.id,
      name: user.role.name,
    },
  });
};

export const logout = async (
  req: Request,
  res: Response
) => {
  const authReq = req as Request & {
    user?: {
      userId: string;
    };
  };

  if (authReq.user?.userId) {
    await prisma.auditLog.create({
      data: {
        userId: authReq.user.userId,
        action: "LOGOUT",
        entity: "User",
        entityId: authReq.user.userId,
        description: "User logged out",
      },
    });
  }

  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
  });

  return successResponse(
    res,
    "Logout successful"
  );
};