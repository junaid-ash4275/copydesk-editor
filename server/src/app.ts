import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config, isProd } from "./config.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.js";
import { documentsRouter } from "./routes/documents.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  if (isProd) app.set("trust proxy", 1);
  app.use(
    cors({
      origin: isProd ? true : config.clientOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/documents", requireAuth, documentsRouter);

  if (isProd && !process.env.VERCEL && fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(config.clientDist, "index.html"));
    });
  }

  app.use("/api", notFound);
  app.use(errorHandler);
  return app;
}
