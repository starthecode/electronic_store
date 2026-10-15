import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { successResponse } from "../../utils/apiResponse.js";
import * as customerService from "../../services/public/customer.service.js";

const userId = (req: AuthenticatedRequest) => req.user!.userId;
const page = (value: unknown) => Math.max(Number.parseInt(String(value ?? "1"), 10) || 1, 1);
const limit = (value: unknown) => Math.min(Math.max(Number.parseInt(String(value ?? "20"), 10) || 20, 1), 100);

export const getCustomerProfile = async (req: AuthenticatedRequest, res: Response) => successResponse(res, "Profile fetched successfully", await customerService.getProfile(userId(req)));
export const updateCustomerProfile = async (req: AuthenticatedRequest, res: Response) => successResponse(res, "Profile updated successfully", await customerService.updateProfile(userId(req), req.body));
export const getCustomerAddresses = async (req: AuthenticatedRequest, res: Response) => successResponse(res, "Addresses fetched successfully", await customerService.listAddresses(userId(req)));
export const createCustomerAddress = async (req: AuthenticatedRequest, res: Response) => successResponse(res, "Address created successfully", await customerService.createAddress(userId(req), req.body), 201);
export const updateCustomerAddress = async (req: AuthenticatedRequest, res: Response) => successResponse(res, "Address updated successfully", await customerService.updateAddress(userId(req), String(req.params.id), req.body));
export const deleteCustomerAddress = async (req: AuthenticatedRequest, res: Response) => { await customerService.deleteAddress(userId(req), String(req.params.id)); return successResponse(res, "Address deleted successfully"); };
export const getCustomerOrders = async (req: AuthenticatedRequest, res: Response) => successResponse(res, "Orders fetched successfully", await customerService.listOrders(userId(req), page(req.query.page), limit(req.query.limit)));
export const getCustomerOrder = async (req: AuthenticatedRequest, res: Response) => successResponse(res, "Order fetched successfully", await customerService.getOrder(userId(req), String(req.params.id)));
