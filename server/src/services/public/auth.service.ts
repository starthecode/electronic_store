import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";
import { hashPassword } from "../../utils/password.js";

interface RegisterCustomerInput {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  password: string;
}

export const registerCustomer = async (input: RegisterCustomerInput) => {
  const email = input.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const customerRole = await prisma.role.findUnique({
    where: { name: "CUSTOMER" },
    select: { id: true, name: true },
  });

  if (!customerRole) {
    throw new AppError("Customer registration is not configured", 503);
  }

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || null,
      email,
      phone: input.phone?.trim() || null,
      passwordHash: await hashPassword(input.password),
      roleId: customerRole.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      role: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      description: "Customer account registered",
    },
  });

  return user;
};
