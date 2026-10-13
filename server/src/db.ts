import "./loadEnv.js";
import { ensureDbFile } from "./lib/ensureDb.js";
import { PrismaClient } from "@prisma/client";

ensureDbFile();

export const prisma = new PrismaClient();
