import type { Document, Share, User } from "@prisma/client";

type Owner = Pick<User, "id" | "name" | "email">;
type Collaborator = Owner & { role: "owner" | "editor" };

export type DocumentRecord = Document & {
  owner: Owner;
  shares?: (Share & { user: Owner })[];
};

export function publicUser(user: Owner) {
  return { id: user.id, name: user.name, email: user.email };
}

export function summarizeDocument(doc: DocumentRecord, currentUserId: string) {
  return {
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    role: doc.ownerId === currentUserId ? ("owner" as const) : ("shared" as const),
    owner: publicUser(doc.owner),
    shareCount: doc.shares?.length ?? 0,
  };
}

export function detailDocument(doc: DocumentRecord, currentUserId: string) {
  const collaborators: Collaborator[] = [
    { ...publicUser(doc.owner), role: "owner" },
    ...(doc.shares ?? []).map((share) => ({
      ...publicUser(share.user),
      role: "editor" as const,
    })),
  ];

  return {
    ...summarizeDocument(doc, currentUserId),
    content: JSON.parse(doc.content),
    collaborators,
  };
}
