import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { userFromToken } from "../services/authService.js";
import { HttpError } from "../lib/httpError.js";

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = (await userFromToken(req.cookies?.[config.cookieName])) ?? undefined;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  await optionalAuth(req, res, (error) => {
    if (error) return next(error);
    if (!req.user) return next(new HttpError(401, "Sign in to continue."));
    next();
  });
}
