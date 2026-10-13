export type User = {
  id: string;
  name: string;
  email: string;
};

export type DocumentRole = "owner" | "shared";

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  role: DocumentRole;
  owner: User;
  shareCount: number;
};

export type Collaborator = User & { role: "owner" | "editor" };

export type DocumentDetail = DocumentSummary & {
  content: Record<string, unknown>;
  collaborators: Collaborator[];
};

export type DocumentLists = {
  owned: DocumentSummary[];
  shared: DocumentSummary[];
};

export type CommentKind = "comment" | "suggestion";

export type DocComment = {
  id: string;
  body: string;
  quote: string;
  kind: CommentKind;
  resolved: boolean;
  createdAt: string;
  author: User;
};

export type DocVersion = {
  id: string;
  title: string;
  content: Record<string, unknown>;
  createdAt: string;
  createdBy: User;
};
