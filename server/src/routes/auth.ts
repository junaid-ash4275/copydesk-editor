import { Router } from "express";
import { z } from "zod";
import { login, logout } from "../services/authService.js";
import { config } from "../config.js";
import { clearSessionCookie, setSessionCookie } from "../lib/sessions.js";
import { requireAuth } from "../middleware/auth.js";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { token, user } = await login(email, password);
    setSessionCookie(res, token);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    await logout(req.cookies?.[config.cookieName]);
    clearSessionCookie(res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
