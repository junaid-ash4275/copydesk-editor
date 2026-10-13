import crypto from "node:crypto";
import type { Response } from "express";
import { config, isProd } from "../config.js";

export function sessionExpiry() {
  return new Date(Date.now() + config.sessionDays * 24 * 60 * 60 * 1000);
}

export function signSessionToken(userId: string, expiresAt: Date) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: expiresAt.toISOString() }), "utf8").toString(
    "base64url",
  );
  const sig = crypto.createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readSignedSession(token: string): { userId: string } | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid?: string; exp?: string };
    if (!data.uid || !data.exp || new Date(data.exp) < new Date()) return null;
    return { userId: data.uid };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: isProd ? "lax" : "lax",
    secure: isProd,
    path: "/",
    maxAge: config.sessionDays * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(config.cookieName, { path: "/" });
}
