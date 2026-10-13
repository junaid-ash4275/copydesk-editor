import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tmpDb = "/tmp/copydesk.db";

function demoDbPath() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return [
    path.resolve(process.cwd(), "api/demo.db"),
    path.resolve(process.cwd(), "server/prisma/demo.db"),
    path.resolve(here, "../../prisma/demo.db"),
    path.resolve(here, "../../../prisma/demo.db"),
    path.resolve(here, "../../../../api/demo.db"),
  ].find((candidate) => fs.existsSync(candidate));
}

export function ensureDbFile() {
  const onVercelLambda = Boolean(
    process.env.VERCEL && (process.env.VERCEL_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME),
  );
  if (!onVercelLambda) return;

  process.env.DATABASE_URL = `file://${tmpDb}`;
  if (fs.existsSync(tmpDb)) return;

  const source = demoDbPath();
  if (!source) {
    throw new Error("Copydesk demo database is missing from the deploy bundle.");
  }
  fs.copyFileSync(source, tmpDb);
}
