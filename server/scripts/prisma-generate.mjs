process.env.DATABASE_URL ||= "file:./dev.db";
const { execSync } = await import("node:child_process");
execSync("prisma generate", { stdio: "inherit", env: process.env });
