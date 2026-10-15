import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import roleRoutes from "./routes/role.routes.js";
import permissionRoutes from "./routes/permission.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import productRoutes from "./routes/product.routes.js";
import productVariantRoutes from "./routes/productVariant.routes.js";
import attributeRoutes from "./routes/attribute.routes.js";
import variantAttributeRoutes from "./routes/variantAttribute.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import productImageRoutes from "./routes/productImage.routes.js";
import specificationRoutes from "./routes/specification.routes.js";
import discountRoutes from "./routes/discount.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import orderFulfillmentRoutes from "./routes/orderFulfillment.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import affiliateMarketplaceRoutes from "./routes/affiliateMarketplace.routes.js";

import { errorMiddleware } from "./middleware/error.middleware.js";
import affiliateProductRoutes from "./routes/affiliateProduct.routes.js";
import settingRoutes from "./routes/setting.routes.js";
import affiliateClickRoutes from "./routes/affiliateClick.routes.js";
import affiliateReportRoutes from "./routes/affiliateReport.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import storeProductRoutes from "./routes/public/storeProduct.routes.js";
import storeCategoryRoutes from "./routes/public/storeCategory.routes.js";
import storeBrandRoutes from "./routes/public/storeBrand.routes.js";
import checkoutRoutes from "./routes/public/checkout.routes.js";

import customerOrderRoutes
  from "./routes/public/customerOrder.routes.js";
import publicCustomerRoutes from "./routes/public/customer.routes.js";


const app = express();

app.use(helmet());

const allowedOrigins = (
  process.env.CLIENT_URLS ||
  "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests / tools without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by CORS")
      );
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Electronic Store API",
  });
});

//Public Routes
app.use(
  "/api/store/products",
  storeProductRoutes
);

app.use(
  "/api/store/categories",
  storeCategoryRoutes
);

app.use(
  "/api/store/brands",
  storeBrandRoutes
);

app.use(
  "/api/store/checkout",
  checkoutRoutes
);

app.use(
  "/api/store/account/orders",
  customerOrderRoutes
);

app.use("/api/store/account", publicCustomerRoutes);

app.use("/api/health", healthRoutes);


// Protected APIs
app.use("/api/auth", authRoutes);

app.use("/api/users", adminUserRoutes);

app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/brands", brandRoutes);

app.use("/api/products", productRoutes);

app.use("/api/products", productVariantRoutes);

app.use("/api/attributes", attributeRoutes);
app.use("/api/products", variantAttributeRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", productImageRoutes);
app.use("/api", specificationRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderFulfillmentRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/affiliate-marketplaces", affiliateMarketplaceRoutes);
app.use("/api/affiliate-products", affiliateProductRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/affiliate", affiliateClickRoutes);
app.use("/api/reports/affiliate", affiliateReportRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorMiddleware);

export default app;
