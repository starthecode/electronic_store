import type { Request, Response } from "express";
import {
    adjustInventory,
    createInventory,
    getInventory,
    getInventoryList,
    getInventorySummary,
    getInventoryTransactions,
    releaseInventory,
    reserveInventory,
    updateInventory,
} from "../services/inventory.service.js";
import { successResponse } from "../utils/apiResponse.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";


export const getInventoryController = async (
    req: Request,
    res: Response
) => {
    const data = await getInventory(
        String(req.params.productId),
        String(req.params.variantId)
    );

    return successResponse(
        res,
        "Inventory fetched successfully",
        data
    );
};


export const getInventoryListController = async (
    req: Request,
    res: Response
) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const search =
        typeof req.query.search === "string"
            ? req.query.search
            : undefined;

    const lowStock =
        req.query.lowStock === "true";

    const data = await getInventoryList({
        page,
        limit,
        search,
        lowStock,
    });

    return successResponse(
        res,
        "Inventory list fetched successfully",
        data
    );
};

export const createInventoryController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const data = await createInventory(
        String(req.params.productId),
        String(req.params.variantId),
        req.body,
        String(req.user?.userId)
    );

    return successResponse(
        res,
        "Inventory created successfully",
        data,
        201
    );
};

export const updateInventoryController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const data = await updateInventory(
        String(req.params.productId),
        String(req.params.variantId),
        req.body,
        String(req.user?.userId)
    );

    return successResponse(
        res,
        "Inventory updated successfully",
        data
    );
};

export const adjustInventoryController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const data = await adjustInventory(
        String(req.params.productId),
        String(req.params.variantId),
        req.body,
        String(req.user?.userId)
    );

    return successResponse(
        res,
        "Inventory adjusted successfully",
        data
    );
};

export const reserveInventoryController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const data = await reserveInventory(
        String(req.params.productId),
        String(req.params.variantId),
        req.body,
        String(req.user?.userId)
    );

    return successResponse(
        res,
        "Inventory reserved successfully",
        data
    );
};

export const releaseInventoryController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const data = await releaseInventory(
        String(req.params.productId),
        String(req.params.variantId),
        req.body,
        String(req.user?.userId)
    );

    return successResponse(
        res,
        "Inventory released successfully",
        data
    );
};

export const getInventorySummaryController = async (
    _req: Request,
    res: Response
) => {
    const data = await getInventorySummary();

    return successResponse(
        res,
        "Inventory summary fetched successfully",
        data
    );
};

export const getInventoryTransactionsController = async (
    req: Request,
    res: Response
) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const type =
        typeof req.query.type === "string"
            ? req.query.type
            : undefined;

    const data = await getInventoryTransactions(
        String(req.params.productId),
        String(req.params.variantId),
        {
            page,
            limit,
            type: type as any,
        }
    );

    return successResponse(
        res,
        "Inventory transactions fetched successfully",
        data
    );
};