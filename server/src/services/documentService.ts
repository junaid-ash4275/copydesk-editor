import { prisma } from "../db.js";
import { HttpError } from "../lib/httpError.js";
import { emptyDoc, serializeDoc, type TiptapNode } from "../lib/tiptap.js";
import { detailDocument, summarizeDocument } from "../lib/serializers.js";
import { documentInclude, requireDocumentAccess } from "./documentAccess.js";

export async function listDocuments(userId: string) {
  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      include: documentInclude,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId } } },
      include: documentInclude,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    owned: owned.map((doc) => summarizeDocument(doc, userId)),
    shared: shared.map((doc) => summarizeDocument(doc, userId)),
  };
}

export async function getDocument(documentId: string, userId: string) {
  const { doc } = await requireDocumentAccess(documentId, userId);
  return detailDocument(doc, userId);
}

export async function createDocument(
  userId: string,
  input: { title?: string; content?: TiptapNode },
) {
  const title = input.title?.trim() || "Untitled";
  const doc = await prisma.document.create({
    data: {
      title,
      content: serializeDoc(input.content ?? emptyDoc()),
      ownerId: userId,
    },
    include: documentInclude,
  });
  return detailDocument(doc, userId);
}

export async function loadOrMaterialize(
  documentId: string,
  userId: string,
  seed?: { title?: string; content?: TiptapNode },
) {
  try {
    return await requireDocumentAccess(documentId, userId);
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 404) throw error;
    const doc = await prisma.document.create({
      data: {
        id: documentId,
        title: seed?.title?.trim() || "Untitled",
        content: serializeDoc(seed?.content ?? emptyDoc()),
        ownerId: userId,
      },
      include: documentInclude,
    });
    return { doc, isOwner: true };
  }
}

export async function updateDocument(
  documentId: string,
  userId: string,
  input: { title?: string; content?: TiptapNode },
) {
  const { doc, isOwner } = await loadOrMaterialize(documentId, userId, input);
  if (input.title !== undefined && !isOwner) {
    throw new HttpError(403, "Only the owner can rename this document.");
  }

  const updated = await prisma.document.update({
    where: { id: doc.id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() || "Untitled" } : {}),
      ...(input.content !== undefined ? { content: serializeDoc(input.content) } : {}),
    },
    include: documentInclude,
  });
  return detailDocument(updated, userId);
}

export async function deleteDocument(documentId: string, userId: string) {
  const { isOwner, doc } = await requireDocumentAccess(documentId, userId);
  if (!isOwner) throw new HttpError(403, "Only the owner can delete this document.");
  await prisma.document.delete({ where: { id: doc.id } });
}
