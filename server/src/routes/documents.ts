import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { config } from "../config.js";
import { HttpError } from "../lib/httpError.js";
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from "../services/documentService.js";
import { importFile } from "../services/importService.js";
import { shareDocument, unshareDocument } from "../services/shareService.js";
import { createComment, listComments, resolveComment } from "../services/commentService.js";
import { heartbeat } from "../services/presenceService.js";
import { deleteVersion, listVersions, restoreVersion, saveNamedVersion } from "../services/versionService.js";
import { parseDoc, tiptapToMarkdown, type TiptapNode } from "../lib/tiptap.js";
import { requireDocumentAccess } from "../services/documentAccess.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
});

const tiptapNode = z
  .object({
    type: z.string(),
  })
  .passthrough();

const createSchema = z.object({
  title: z.string().max(160).optional(),
});

const updateSchema = z
  .object({
    title: z.string().max(160).optional(),
    content: tiptapNode.optional(),
  })
  .refine((value) => value.title !== undefined || value.content !== undefined, {
    message: "Nothing to update.",
  });

const shareSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

const commentSchema = z.object({
  body: z.string().min(1).max(4000),
  quote: z.string().max(500).optional(),
  kind: z.enum(["comment", "suggestion"]).optional(),
});

export const documentsRouter = Router();

documentsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listDocuments(req.user!.id));
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body ?? {});
    res.status(201).json(await createDocument(req.user!.id, body));
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/import", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, "Choose a .txt or .md file to import.");
    res.status(201).json(await importFile(req.user!.id, req.file));
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/:id", async (req, res, next) => {
  try {
    res.json(await getDocument(req.params.id, req.user!.id));
  } catch (error) {
    next(error);
  }
});

documentsRouter.patch("/:id", async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    res.json(
      await updateDocument(req.params.id, req.user!.id, {
        title: body.title,
        content: body.content as TiptapNode | undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

documentsRouter.delete("/:id", async (req, res, next) => {
  try {
    await deleteDocument(req.params.id, req.user!.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/:id/share", async (req, res, next) => {
  try {
    const { email } = shareSchema.parse(req.body);
    res.json(await shareDocument(req.params.id, req.user!.id, email));
  } catch (error) {
    next(error);
  }
});

documentsRouter.delete("/:id/share/:userId", async (req, res, next) => {
  try {
    res.json(await unshareDocument(req.params.id, req.user!.id, req.params.userId));
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/:id/presence", async (req, res, next) => {
  try {
    res.json({ viewers: await heartbeat(req.params.id, req.user!.id) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/:id/comments", async (req, res, next) => {
  try {
    res.json({ comments: await listComments(req.params.id, req.user!.id) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/:id/comments", async (req, res, next) => {
  try {
    const body = commentSchema.parse(req.body);
    res.status(201).json(
      await createComment(req.params.id, req.user!.id, {
        body: body.body,
        quote: body.quote,
        kind: body.kind,
      }),
    );
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/:id/comments/:commentId/resolve", async (req, res, next) => {
  try {
    res.json(await resolveComment(req.params.id, req.params.commentId, req.user!.id));
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/:id/versions", async (req, res, next) => {
  try {
    res.json({ versions: await listVersions(req.params.id, req.user!.id) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/:id/versions", async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().max(160).optional(),
        content: tiptapNode.optional(),
      })
      .parse(req.body ?? {});
    res.status(201).json({
      versions: await saveNamedVersion(req.params.id, req.user!.id, {
        title: body.title,
        content: body.content as TiptapNode | undefined,
      }),
    });
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/:id/versions/:versionId/restore", async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().max(160).optional(),
        content: tiptapNode.optional(),
      })
      .parse(req.body ?? {});
    res.json(
      await restoreVersion(req.params.id, req.params.versionId, req.user!.id, {
        title: body.title,
        content: body.content as TiptapNode | undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

documentsRouter.delete("/:id/versions/:versionId", async (req, res, next) => {
  try {
    res.json({ versions: await deleteVersion(req.params.id, req.params.versionId, req.user!.id) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/:id/export", async (req, res, next) => {
  try {
    const format = String(req.query.format ?? "md");
    if (format !== "md") throw new HttpError(400, "Only Markdown export is available from the API.");
    const { doc } = await requireDocumentAccess(req.params.id, req.user!.id);
    const markdown = tiptapToMarkdown(parseDoc(doc.content));
    const slug = doc.title.replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-") || "document";
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${slug}.md"`);
    res.send(markdown);
  } catch (error) {
    next(error);
  }
});
