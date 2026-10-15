import type { AddressType, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/AppError.js";

const CUSTOMER_ROLE = "CUSTOMER";
export interface CustomerProfileInput { firstName: string; lastName?: string; phone?: string; }
export interface AddressInput { type: AddressType; firstName: string; lastName?: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; postalCode: string; country?: string; isDefault?: boolean; }

const customerSelect = { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, role: { select: { id: true, name: true } } } satisfies Prisma.UserSelect;
const ensureCustomer = async (userId: string) => {
  const customer = await prisma.user.findFirst({ where: { id: userId, role: { name: CUSTOMER_ROLE } }, select: customerSelect });
  if (!customer) throw new AppError("Customer account required", 403);
  return customer;
};

export const getProfile = (userId: string) => ensureCustomer(userId);
export const updateProfile = async (userId: string, input: CustomerProfileInput) => {
  await ensureCustomer(userId);
  return prisma.user.update({ where: { id: userId }, data: { firstName: input.firstName.trim(), lastName: input.lastName?.trim() || null, phone: input.phone?.trim() || null }, select: customerSelect });
};
export const listAddresses = async (userId: string) => { await ensureCustomer(userId); return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] }); };

const addressData = (input: AddressInput) => ({ type: input.type, firstName: input.firstName.trim(), lastName: input.lastName?.trim() || null, phone: input.phone.trim(), addressLine1: input.addressLine1.trim(), addressLine2: input.addressLine2?.trim() || null, city: input.city.trim(), state: input.state.trim(), postalCode: input.postalCode.trim(), country: input.country?.trim() || "India", ...(input.isDefault === undefined ? {} : { isDefault: input.isDefault }) });
const ownedAddress = async (userId: string, id: string) => {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) throw new AppError("Address not found", 404);
  return address;
};
export const createAddress = async (userId: string, input: AddressInput) => {

  console.log("ADDRESS PAYLOAD:", JSON.stringify(input, null, 2));

  await ensureCustomer(userId);
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) await tx.address.updateMany({ where: { userId, type: input.type, isDefault: true }, data: { isDefault: false } });
    return tx.address.create({ data: { userId, ...addressData(input) } });
  });
};
export const updateAddress = async (userId: string, id: string, input: AddressInput) => {
  await ensureCustomer(userId); await ownedAddress(userId, id);
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) await tx.address.updateMany({ where: { userId, type: input.type, isDefault: true, id: { not: id } }, data: { isDefault: false } });
    return tx.address.update({ where: { id }, data: addressData(input) });
  });
};
export const deleteAddress = async (userId: string, id: string) => { await ensureCustomer(userId); await ownedAddress(userId, id); await prisma.address.delete({ where: { id } }); };

export const listOrders = async (userId: string, page: number, limit: number) => {
  await ensureCustomer(userId); const where = { userId }; const skip = (page - 1) * limit;
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, status: true, paymentStatus: true, fulfillmentStatus: true, totalAmount: true, createdAt: true, items: { select: { id: true, productName: true, variantName: true, quantity: true, totalPrice: true } } } }),
    prisma.order.count({ where }),
  ]);
  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
export const getOrder = async (userId: string, id: string) => {
  await ensureCustomer(userId);
  const order = await prisma.order.findFirst({ where: { id, userId }, select: { id: true, orderNumber: true, status: true, paymentStatus: true, fulfillmentStatus: true, subtotal: true, discountAmount: true, shippingAmount: true, taxAmount: true, totalAmount: true, shippingAddress: true, billingAddress: true, createdAt: true, updatedAt: true, items: { select: { id: true, productName: true, variantName: true, sku: true, quantity: true, unitPrice: true, totalPrice: true } }, payment: { select: { method: true, status: true, amount: true, currency: true, paidAt: true } }, statusHistory: { orderBy: { createdAt: "desc" }, select: { id: true, status: true, note: true, createdAt: true } } } });
  if (!order) throw new AppError("Order not found", 404);
  return order;
};
