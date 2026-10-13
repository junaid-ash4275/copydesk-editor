import { prisma } from "../db.js";
import { HttpError } from "../lib/httpError.js";
import { parseDoc, serializeDoc, type TiptapNode } from "../lib/tiptap.js";
import { detailDocument, publicUser } from "../lib/serializers.js";
import { documentInclude, requireDocumentAccess } from "./documentAccess.js";
import { loadOrMaterialize } from "./documentService.js";

const MAX_VERSIONS = 30;

async function pruneVersions(documentId: string) {
  const extra = await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    skip: MAX_VERSIONS,
    select: { id: true },
  });
  if (extra.length) {
    await prisma.documentVersion.deleteMany({ where: { id: { in: extra.map((row) => row.id) } } });
  }
}

function serializeVersion(row: {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  createdBy: { id: string; name: string; email: string };
}) {
  return {
    id: row.id,
    title: row.title,
    content: parseDoc(row.content),
    createdAt: row.createdAt.toISOString(),
    createdBy: publicUser(row.createdBy),
  };
}

export async function listVersions(documentId: string, userId: string) {
  await requireDocumentAccess(documentId, userId);
  const rows = await prisma.documentVersion.findMany({
    where: { documentId },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeVersion);
}

export async function restoreVersion(
  documentId: string,
  versionId: string,
  userId: string,
  snapshot?: { title?: string; content?: TiptapNode },
) {
  const { doc } = await requireDocumentAccess(documentId, userId);
  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId },
  });
  const title = version?.title ?? snapshot?.title?.trim();
  const content = version?.content ?? (snapshot?.content ? serializeDoc(snapshot.content) : undefined);
  if (!title || !content) throw new HttpError(404, "Version not found.");

  const updated = await prisma.document.update({
    where: { id: doc.id },
    data: { title, content },
    include: documentInclude,
  });
  return detailDocument(updated, userId);
}

export async function deleteVersion(documentId: string, versionId: string, userId: string) {
  await requireDocumentAccess(documentId, userId);
  const removed = await prisma.documentVersion.deleteMany({
    where: { id: versionId, documentId },
  });
  if (!removed.count) throw new HttpError(404, "Version not found.");
  return listVersions(documentId, userId);
}

export async function saveNamedVersion(
  documentId: string,
  userId: string,
  snapshot?: { title?: string; content?: TiptapNode },
) {
  const { doc } = await loadOrMaterialize(documentId, userId, snapshot);
  const title = snapshot?.title?.trim() || doc.title;
  const content = snapshot?.content ? serializeDoc(snapshot.content) : doc.content;

  if (snapshot?.title !== undefined || snapshot?.content !== undefined) {
    await prisma.document.update({
      where: { id: doc.id },
      data: {
        ...(snapshot?.title !== undefined ? { title } : {}),
        ...(snapshot?.content !== undefined ? { content } : {}),
      },
    });
  }

  await prisma.documentVersion.create({
    data: {
      documentId: doc.id,
      createdById: userId,
      title,
      content,
    },
  });
  await pruneVersions(doc.id);
  return listVersions(documentId, userId);
}
