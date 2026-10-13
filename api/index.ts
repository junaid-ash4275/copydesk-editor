import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

export const config = {
  api: {
    bodyParser: false,
  },
};

let app: ((req: IncomingMessage, res: ServerResponse) => void) | undefined;

function compiledAppUrl() {
  const candidates = [
    path.join(process.cwd(), "server/dist/app.js"),
    path.join(process.cwd(), "dist/app.js"),
    path.resolve(__dirname, "../server/dist/app.js"),
  ];
  const match = candidates.find((file) => fs.existsSync(file));
  if (!match) {
    throw new Error(`Copydesk server bundle missing. Looked in: ${candidates.join(", ")}`);
  }
  return pathToFileURL(match).href;
}

function restoreOriginalUrl(req: IncomingMessage) {
  if (!req.url) return;
  const url = new URL(req.url, "http://local");
  const original = url.searchParams.get("__original");
  if (!original) return;
  url.searchParams.delete("__original");
  const qs = url.searchParams.toString();
  req.url = original + (qs ? `?${qs}` : "");
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    restoreOriginalUrl(req);
    if (!app) {
      const { createApp } = await import(compiledAppUrl());
      app = createApp();
    }
    app(req, res);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
