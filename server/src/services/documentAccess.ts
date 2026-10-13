import { prisma } from "../db.js";
import { HttpError } from "../lib/httpError.js";

export const documentInclude = {
  owner: { select: { id: true, name: true, email: true } },
  shares: { include: { user: { select: { id: true, name: true, email: true } } } },
} as const;

export async function requireDocumentAccess(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: documentInclude,
  });
  if (!doc) throw new HttpError(404, "Document not found.");
  const isOwner = doc.ownerId === userId;
  const isShared = doc.shares.some((share) => share.userId === userId);
  if (!isOwner && !isShared) throw new HttpError(403, "You do not have access to this document.");
  return { doc, isOwner };
}
