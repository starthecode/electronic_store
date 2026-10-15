import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { addressIdSchema, createAddressSchema, orderIdSchema, orderListSchema, profileSchema } from "../../validators/public/customer.validator.js";
import { createCustomerAddress, deleteCustomerAddress, getCustomerAddresses, getCustomerOrder, getCustomerOrders, getCustomerProfile, updateCustomerAddress, updateCustomerProfile } from "../../controllers/public/customer.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/profile", asyncHandler(getCustomerProfile));
router.patch("/profile", validate(profileSchema), asyncHandler(updateCustomerProfile));
router.get("/addresses", asyncHandler(getCustomerAddresses));
router.post("/addresses", validate(createAddressSchema), asyncHandler(createCustomerAddress));
router.patch("/addresses/:id", validate(addressIdSchema), asyncHandler(updateCustomerAddress));
router.delete("/addresses/:id", validate(addressIdSchema), asyncHandler(deleteCustomerAddress));
router.get("/orders", validate(orderListSchema), asyncHandler(getCustomerOrders));
router.get("/orders/:id", validate(orderIdSchema), asyncHandler(getCustomerOrder));
export default router;
