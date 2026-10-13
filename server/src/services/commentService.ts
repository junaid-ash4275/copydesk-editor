import { prisma } from "../db.js";
import { HttpError } from "../lib/httpError.js";
import { publicUser } from "../lib/serializers.js";
import { requireDocumentAccess } from "./documentAccess.js";

const KINDS = ["comment", "suggestion"] as const;

function serializeComment(row: {
  id: string;
  body: string;
  quote: string;
  kind: string;
  resolvedAt: Date | null;
  createdAt: Date;
  author: { id: string; name: string; email: string };
}) {
  return {
    id: row.id,
    body: row.body,
    quote: row.quote,
    kind: row.kind as "comment" | "suggestion",
    resolved: Boolean(row.resolvedAt),
    createdAt: row.createdAt.toISOString(),
    author: publicUser(row.author),
  };
}

export async function listComments(documentId: string, userId: string) {
  await requireDocumentAccess(documentId, userId);
  const rows = await prisma.comment.findMany({
    where: { documentId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeComment);
}

export async function createComment(
  documentId: string,
  userId: string,
  input: { body: string; quote?: string; kind?: string },
) {
  await requireDocumentAccess(documentId, userId);
  const body = input.body.trim();
  if (!body) throw new HttpError(400, "Write a comment before posting.");
  const kind = KINDS.includes(input.kind as (typeof KINDS)[number]) ? input.kind! : "comment";
  const row = await prisma.comment.create({
    data: {
      documentId,
      authorId: userId,
      body,
      quote: (input.quote ?? "").trim().slice(0, 500),
      kind,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return serializeComment(row);
}

export async function resolveComment(documentId: string, commentId: string, userId: string) {
  await requireDocumentAccess(documentId, userId);
  const existing = await prisma.comment.findFirst({
    where: { id: commentId, documentId },
  });
  if (!existing) throw new HttpError(404, "Comment not found.");
  const row = await prisma.comment.update({
    where: { id: commentId },
    data: { resolvedAt: existing.resolvedAt ? null : new Date() },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return serializeComment(row);
}
