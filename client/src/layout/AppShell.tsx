import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { createDocument, importDocument, listDocuments } from "../api/documents";
import type { DocumentLists } from "../api/types";
import { Sidebar } from "./Sidebar";
import { useToast } from "../ui/Toast";
import { ApiError } from "../api/http";

export function AppShell() {
  const [lists, setLists] = useState<DocumentLists | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const refresh = useCallback(async () => {
    try {
      setLists(await listDocuments());
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : "Could not load documents.", "error");
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onNew() {
    try {
      const doc = await createDocument("Untitled");
      await refresh();
      navigate(`/d/${doc.id}`, { state: { draft: doc } });
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : "Could not create document.", "error");
    }
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    try {
      const doc = await importDocument(file);
      await refresh();
      toast.push(`Imported “${doc.title}”.`);
      navigate(`/d/${doc.id}`, { state: { draft: doc } });
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : "Import failed.", "error");
    }
  }

  return (
    <div className="shell">
      <Sidebar lists={lists} onNew={onNew} onImport={() => fileRef.current?.click()} />
      <main className="main">
        <Outlet context={{ lists, refresh, onNew }} />
      </main>
      <input
        ref={fileRef}
        className="hidden-file"
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        onChange={(event) => {
          void onPickFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
