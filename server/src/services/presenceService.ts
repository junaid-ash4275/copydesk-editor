import { prisma } from "../db.js";
import { publicUser } from "../lib/serializers.js";
import { requireDocumentAccess } from "./documentAccess.js";

const ACTIVE_MS = 20_000;

export async function heartbeat(documentId: string, userId: string) {
  await requireDocumentAccess(documentId, userId);
  await prisma.presence.upsert({
    where: { documentId_userId: { documentId, userId } },
    update: { lastSeenAt: new Date() },
    create: { documentId, userId, lastSeenAt: new Date() },
  });
  return listViewers(documentId, userId);
}

export async function listViewers(documentId: string, userId: string) {
  await requireDocumentAccess(documentId, userId);
  const since = new Date(Date.now() - ACTIVE_MS);
  const rows = await prisma.presence.findMany({
    where: { documentId, lastSeenAt: { gte: since } },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { lastSeenAt: "desc" },
  });
  return rows.map((row) => publicUser(row.user));
}
