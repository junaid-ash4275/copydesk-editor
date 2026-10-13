import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { HttpError } from "../lib/httpError.js";
import { isProd } from "../config.js";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found." });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message ?? "Invalid request." });
  }
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File must be 2 MB or smaller." });
    }
    return res.status(400).json({ error: "Could not read that file." });
  }
  console.error(err);
  res.status(500).json({
    error: isProd ? "Something went wrong." : err instanceof Error ? err.message : "Unknown error",
  });
}
