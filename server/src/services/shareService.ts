import { prisma } from "../db.js";
import { HttpError } from "../lib/httpError.js";
import { detailDocument } from "../lib/serializers.js";

const documentInclude = {
  owner: { select: { id: true, name: true, email: true } },
  shares: { include: { user: { select: { id: true, name: true, email: true } } } },
} as const;

async function loadOwned(documentId: string, ownerId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: documentInclude,
  });
  if (!doc) throw new HttpError(404, "Document not found.");
  if (doc.ownerId !== ownerId) {
    throw new HttpError(403, "Only the owner can change sharing.");
  }
  return doc;
}

export async function shareDocument(documentId: string, ownerId: string, email: string) {
  const doc = await loadOwned(documentId, ownerId);
  const target = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!target) throw new HttpError(404, "No user exists with that email.");
  if (target.id === ownerId) {
    throw new HttpError(400, "You already own this document.");
  }

  const already = doc.shares.some((share) => share.userId === target.id);
  if (already) throw new HttpError(409, "That person already has access.");

  await prisma.share.create({
    data: { documentId: doc.id, userId: target.id },
  });

  const updated = await prisma.document.findUniqueOrThrow({
    where: { id: doc.id },
    include: documentInclude,
  });
  return detailDocument(updated, ownerId);
}

export async function unshareDocument(documentId: string, ownerId: string, userId: string) {
  await loadOwned(documentId, ownerId);
  const removed = await prisma.share.deleteMany({
    where: { documentId, userId },
  });
  if (!removed.count) throw new HttpError(404, "That person does not have access.");

  const updated = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    include: documentInclude,
  });
  return detailDocument(updated, ownerId);
}
