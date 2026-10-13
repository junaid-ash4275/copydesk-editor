import { useOutletContext, useNavigate } from "react-router-dom";
import { useState } from "react";
import { DocumentList } from "../features/documents/DocumentList";
import { deleteDocument } from "../api/documents";
import type { DocumentLists, DocumentSummary } from "../api/types";
import { Dialog } from "../ui/Dialog";
import { useToast } from "../ui/Toast";
import { ApiError } from "../api/http";
import { useAuth } from "../auth/AuthProvider";

type ShellContext = {
  lists: DocumentLists | null;
  refresh: () => Promise<void>;
  onNew: () => Promise<void>;
};

export function HomePage() {
  const { lists, refresh, onNew } = useOutletContext<ShellContext>();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [pending, setPending] = useState<DocumentSummary | null>(null);

  async function confirmDelete() {
    if (!pending) return;
    try {
      await deleteDocument(pending.id);
      setPending(null);
      await refresh();
      toast.push("Document deleted.");
      navigate("/");
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : "Could not delete.", "error");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Documents</h1>
          <p>
            {user
              ? `Signed in as ${user.name}. Owned and shared work stay in separate lists. Import accepts .txt and .md, up to 2 MB.`
              : ""}
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => void onNew()}>
          New document
        </button>
      </div>

      <DocumentList
        title="My documents"
        empty="Create a document or import a .txt / .md file."
        documents={lists?.owned ?? []}
        onDelete={setPending}
      />
      <DocumentList
        title="Shared with me"
        empty="When someone grants you access, it will appear here."
        documents={lists?.shared ?? []}
      />

      {pending ? (
        <Dialog
          title="Delete document"
          description={`“${pending.title}” will be removed for everyone who has access. This cannot be undone.`}
          onClose={() => setPending(null)}
        >
          <div className="dialog-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setPending(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" type="button" onClick={() => void confirmDelete()}>
              Delete
            </button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
