import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";


import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
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

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use(errorMiddleware);

export default app;