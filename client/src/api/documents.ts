import { request } from "./http";
import type { CommentKind, DocComment, DocVersion, DocumentDetail, DocumentLists, User } from "./types";

export function listDocuments() {
  return request<DocumentLists>("/api/documents");
}

export function getDocument(id: string) {
  return request<DocumentDetail>(`/api/documents/${id}`);
}

export function createDocument(title?: string) {
  return request<DocumentDetail>("/api/documents", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function updateDocument(
  id: string,
  patch: { title?: string; content?: Record<string, unknown> },
) {
  return request<DocumentDetail>(`/api/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteDocument(id: string) {
  return request<void>(`/api/documents/${id}`, { method: "DELETE" });
}

export function shareDocument(id: string, email: string) {
  return request<DocumentDetail>(`/api/documents/${id}/share`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function unshareDocument(id: string, userId: string) {
  return request<DocumentDetail>(`/api/documents/${id}/share/${userId}`, {
    method: "DELETE",
  });
}

export function importDocument(file: File) {
  const body = new FormData();
  body.append("file", file);
  return request<DocumentDetail>("/api/documents/import", {
    method: "POST",
    body,
  });
}

export function heartbeat(id: string) {
  return request<{ viewers: User[] }>(`/api/documents/${id}/presence`, { method: "POST" });
}

export function listComments(id: string) {
  return request<{ comments: DocComment[] }>(`/api/documents/${id}/comments`);
}

export function createComment(
  id: string,
  input: { body: string; quote?: string; kind?: CommentKind },
) {
  return request<DocComment>(`/api/documents/${id}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resolveComment(id: string, commentId: string) {
  return request<DocComment>(`/api/documents/${id}/comments/${commentId}/resolve`, {
    method: "POST",
  });
}

export function listVersions(id: string) {
  return request<{ versions: DocVersion[] }>(`/api/documents/${id}/versions`);
}

export function saveVersion(id: string, snapshot?: { title?: string; content?: Record<string, unknown> }) {
  return request<{ versions: DocVersion[] }>(`/api/documents/${id}/versions`, {
    method: "POST",
    body: snapshot ? JSON.stringify(snapshot) : undefined,
  });
}

export function restoreVersion(
  id: string,
  versionId: string,
  snapshot?: { title?: string; content?: Record<string, unknown> },
) {
  return request<DocumentDetail>(`/api/documents/${id}/versions/${versionId}/restore`, {
    method: "POST",
    body: snapshot ? JSON.stringify(snapshot) : undefined,
  });
}

export function deleteVersion(id: string, versionId: string) {
  return request<{ versions: DocVersion[] }>(`/api/documents/${id}/versions/${versionId}`, {
    method: "DELETE",
  });
}

export async function downloadMarkdown(id: string, title: string) {
  const response = await fetch(`/api/documents/${id}/export?format=md`, { credentials: "include" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Export failed.");
  }
  const blob = await response.blob();
  const slug = title.replace(/[^\w\s-]+/g, "").trim().replace(/\s+/g, "-") || "document";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug}.md`;
  link.click();
  URL.revokeObjectURL(url);
}
