import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  sessionDays: Number(process.env.SESSION_DAYS ?? 7),
  sessionSecret: process.env.SESSION_SECRET ?? "copydesk-demo-session",
  cookieName: "copydesk_session",
  maxUploadBytes: 2 * 1024 * 1024,
  allowedImportTypes: [".txt", ".md"] as const,
  clientDist: path.resolve(here, "../../client/dist"),
};

export const isProd = config.nodeEnv === "production";
