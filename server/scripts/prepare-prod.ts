import "../src/loadEnv.js";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/db.js";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

execSync("npx prisma db push", {
  cwd: serverRoot,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? "file:./prod.db" },
});

const users = await prisma.user.count();
if (users === 0) {
  execSync("npx tsx prisma/seed.ts", { cwd: serverRoot, stdio: "inherit", env: process.env });
}

await prisma.$disconnect();
