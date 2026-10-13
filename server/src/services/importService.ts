import path from "node:path";
import { config } from "../config.js";
import { HttpError } from "../lib/httpError.js";
import { markdownToTiptap, textToTiptap, titleFromFilename } from "../lib/tiptap.js";
import { createDocument } from "./documentService.js";

export function assertImportFile(file: Express.Multer.File | undefined) {
  if (!file) throw new HttpError(400, "Choose a .txt or .md file to import.");
  const ext = path.extname(file.originalname).toLowerCase();
  if (!config.allowedImportTypes.includes(ext as ".txt" | ".md")) {
    throw new HttpError(400, "Only .txt and .md files can be imported.");
  }
  if (file.size > config.maxUploadBytes) {
    throw new HttpError(400, "File must be 2 MB or smaller.");
  }
  return ext;
}

export async function importFile(userId: string, file: Express.Multer.File) {
  const ext = assertImportFile(file);
  const body = file.buffer.toString("utf8");
  const content = ext === ".md" ? markdownToTiptap(body) : textToTiptap(body);
  return createDocument(userId, {
    title: titleFromFilename(file.originalname),
    content,
  });
}
