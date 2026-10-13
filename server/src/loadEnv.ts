import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NODE_ENV === "production" ? "file:./prod.db" : "file:./dev.db";
}
