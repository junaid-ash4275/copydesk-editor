import { request } from "./http";
import type { User } from "./types";

export const DEMO_ACCOUNTS = [
  { name: "Alex Okonkwo", email: "alex@ajaia.dev", password: "demo1234", role: "Product" },
  { name: "Blair Chen", email: "blair@ajaia.dev", password: "demo1234", role: "Design" },
  { name: "Casey Romero", email: "casey@ajaia.dev", password: "demo1234", role: "Engineering" },
] as const;

export function login(email: string, password: string) {
  return request<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request<void>("/api/auth/logout", { method: "POST" });
}

export function me() {
  return request<{ user: User }>("/api/auth/me");
}
