import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, Download, MessageSquare, PenLine, Share2 } from "lucide-react";
import {
  createComment,
  downloadMarkdown,
  getDocument,
  heartbeat,
  listComments,
  deleteVersion,
  listVersions,
  resolveComment,
  restoreVersion,
  saveVersion,
  shareDocument,
  unshareDocument,
  updateDocument,
} from "../api/documents";
import type { CommentKind, DocComment, DocVersion, DocumentDetail, DocumentLists, User } from "../api/types";
import { DocumentEditor, type DocumentEditorHandle } from "../features/editor/DocumentEditor";
import { ShareDialog } from "../features/sharing/ShareDialog";
import { PresenceAvatars } from "../features/presence/PresenceAvatars";
import { CommentsRail } from "../features/comments/CommentsRail";
import { HistoryRail } from "../features/history/HistoryRail";
import { ApiError } from "../api/http";
import { useToast } from "../ui/Toast";
import { useAuth } from "../auth/AuthProvider";

type ShellContext = {
  lists: DocumentLists | null;
  refresh: () => Promise<void>;
};

type SaveState = "saved" | "saving" | "unsaved" | "error";
type Rail = "comments" | "suggestions" | "history" | null;

export function EditorPage() {
  const { id } = useParams();
  const location = useLocation();
  const { refresh } = useOutletContext<ShellContext>();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const editorRef = useRef<DocumentEditorHandle>(null);
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [title, setTitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [shareOpen, setShareOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewers, setViewers] = useState<User[]>([]);
  const [comments, setComments] = useState<DocComment[]>([]);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [rail, setRail] = useState<Rail>(null);
  const [quote, setQuote] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const saveTimer = useRef<number | null>(null);
  const titleTimer = useRef<number | null>(null);
  const hiddenVersionIds = useRef(new Set<string>());

  useEffect(() => {
    if (!id) return;
    setLoadError(null);
    setDoc(null);
    setRail(null);
    hiddenVersionIds.current = new Set();
    const draft = (location.state as { draft?: DocumentDetail } | null)?.draft;
    getDocument(id)
      .then((result) => {
        setDoc(result);
        setTitle(result.title);
        setSaveState("saved");
        setEditorKey((value) => value + 1);
      })
      .catch((error) => {
        if (draft?.id === id) {
          setDoc(draft);
          setTitle(draft.title);
          setSaveState("saved");
          setEditorKey((value) => value + 1);
          return;
        }
        setLoadError(error instanceof ApiError ? error.message : "Could not open document.");
      });
  }, [id, location.state]);

  useEffect(() => {
    if (!id || !doc) return;
    let cancelled = false;

    async function ping() {
      try {
        const result = await heartbeat(id!);
        if (!cancelled) setViewers(result.viewers);
      } catch {
        /* presence is best-effort */
      }
    }

    void ping();
    const timer = window.setInterval(() => void ping(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id, doc]);

  useEffect(() => {
    if (!id || (rail !== "comments" && rail !== "suggestions")) return;
    listComments(id)
      .then((result) => setComments(result.comments))
      .catch((error) => toast.push(error instanceof ApiError ? error.message : "Could not load comments.", "error"));
  }, [id, rail, toast]);

  useEffect(() => {
    if (!id || rail !== "history") return;
    listVersions(id)
      .then((result) => setVersions(visibleVersions(result.versions)))
      .catch((error) => toast.push(error instanceof ApiError ? error.message : "Could not load history.", "error"));
  }, [id, rail, toast]);

  function visibleVersions(rows: DocVersion[]) {
    return rows.filter((row) => !hiddenVersionIds.current.has(row.id));
  }

  function cancelPendingSaves() {
    if (titleTimer.current) {
      window.clearTimeout(titleTimer.current);
      titleTimer.current = null;
    }
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }

  function queueSave(patch: { title?: string; content?: Record<string, unknown> }, which: "content" | "title") {
    setSaveState("unsaved");
    const timer = which === "content" ? saveTimer : titleTimer;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      if (!id) return;
      setSaveState("saving");
      try {
        const content = editorRef.current?.getJSON() ?? patch.content;
        const updated = await updateDocument(id, {
          title: patch.title ?? title,
          content,
        });
        setDoc((current) => (current ? { ...current, ...updated, content: current.content } : updated));
        setSaveState("saved");
        if (patch.title !== undefined) await refresh();
      } catch (error) {
        setSaveState("error");
        toast.push(error instanceof ApiError ? error.message : "Save failed.", "error");
      }
    }, 700);
  }

  async function share(email: string) {
    if (!id) return;
    const updated = await shareDocument(id, email);
    setDoc(updated);
    await refresh();
  }

  async function unshare(userId: string) {
    if (!id) return;
    const updated = await unshareDocument(id, userId);
    setDoc(updated);
    await refresh();
  }

  function openComment() {
    const selected = editorRef.current?.selectedQuote() ?? "";
    setQuote(selected);
    setRail((current) => (current === "suggestions" ? "suggestions" : "comments"));
  }

  async function submitComment(input: { body: string; quote?: string; kind: CommentKind }) {
    if (!id) return;
    const created = await createComment(id, input);
    setComments((current) => [created, ...current]);
  }

  async function toggleResolved(commentId: string) {
    if (!id) return;
    const updated = await resolveComment(id, commentId);
    setComments((current) => current.map((comment) => (comment.id === commentId ? updated : comment)));
  }

  async function onRestore(versionId: string) {
    if (!id) return;
    const version = versions.find((row) => row.id === versionId);
    try {
      const updated = await restoreVersion(
        id,
        versionId,
        version ? { title: version.title, content: version.content } : undefined,
      );
      setDoc(updated);
      setTitle(updated.title);
      setEditorKey((value) => value + 1);
      setSaveState("saved");
      await refresh();
      const history = await listVersions(id);
      setVersions(visibleVersions(history.versions));
      toast.push("Version restored.");
    } catch (error) {
      toast.push(error instanceof ApiError ? error.message : "Could not restore version.", "error");
    }
  }

  async function onDeleteVersion(versionId: string) {
    if (!id) return;
    hiddenVersionIds.current.add(versionId);
    setVersions((current) => current.filter((row) => row.id !== versionId));
    try {
      const result = await deleteVersion(id, versionId);
      setVersions(visibleVersions(result.versions));
      toast.push("Version deleted.");
    } catch (error) {
      hiddenVersionIds.current.delete(versionId);
      toast.push(error instanceof ApiError ? error.message : "Could not delete version.", "error");
    }
  }

  if (loadError) {
    return (
      <div className="page">
        <h1>Cannot open document</h1>
        <p className="helper" style={{ marginTop: 8 }}>
          {loadError}
        </p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} type="button" onClick={() => navigate("/")}>
          Back to documents
        </button>
      </div>
    );
  }

  if (!doc || !id) {
    return (
      <div className="page">
        <p className="helper">Opening…</p>
      </div>
    );
  }

  const isOwner = doc.role === "owner";
  const saveLabel =
    saveState === "saving"
      ? "Saving"
      : saveState === "unsaved"
        ? "Unsaved"
        : saveState === "error"
          ? "Save failed"
          : "Saved";

  return (
    <div className="editor-page">
      <header className="chrome">
        <div className="chrome-left">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeft size={14} />
            Documents
          </Link>
          <span className={isOwner ? "badge" : "badge badge-muted"}>{isOwner ? "Owner" : "Shared"}</span>
          <span className="save-state">{saveLabel}</span>
          <PresenceAvatars viewers={viewers} selfId={user?.id} />
        </div>
        <div className="chrome-right">
          <button
            className={`btn ${rail === "suggestions" ? "btn-secondary" : "btn-ghost"}`}
            type="button"
            onClick={() => setRail((current) => (current === "suggestions" ? null : "suggestions"))}
          >
            <PenLine size={14} />
            Suggest
          </button>
          <button
            className={`btn ${rail === "comments" ? "btn-secondary" : "btn-ghost"}`}
            type="button"
            onClick={() => setRail((current) => (current === "comments" ? null : "comments"))}
          >
            <MessageSquare size={14} />
            Comments
          </button>
          <button
            className={`btn ${rail === "history" ? "btn-secondary" : "btn-ghost"}`}
            type="button"
            onClick={() => setRail((current) => (current === "history" ? null : "history"))}
          >
            <Clock3 size={14} />
            History
          </button>
          <div className="menu">
            <button className="btn btn-ghost" type="button" onClick={() => setExportOpen((value) => !value)}>
              <Download size={14} />
              Export
            </button>
            {exportOpen ? (
              <div className="menu-list">
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    void downloadMarkdown(id, title).catch((error) =>
                      toast.push(error instanceof Error ? error.message : "Export failed.", "error"),
                    );
                  }}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    window.print();
                  }}
                >
                  PDF (print)
                </button>
              </div>
            ) : null}
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => setShareOpen(true)}>
            <Share2 size={14} />
            Share
          </button>
        </div>
      </header>

      <div className={`editor-body ${rail ? "has-rail" : ""}`}>
        <div className="editor-main">
          <DocumentEditor
            key={`${id}-${editorKey}`}
            ref={editorRef}
            content={doc.content}
            title={title}
            titleLocked={!isOwner}
            onTitleChange={(next) => {
              setTitle(next);
              queueSave({ title: next }, "title");
            }}
            onChange={(content) => queueSave({ content }, "content")}
            onComment={openComment}
          />
        </div>
        {rail === "comments" || rail === "suggestions" ? (
          <CommentsRail
            key={rail}
            comments={comments}
            quote={quote}
            kind={rail === "suggestions" ? "suggestion" : "comment"}
            onClearQuote={() => setQuote("")}
            onSubmit={submitComment}
            onResolve={toggleResolved}
          />
        ) : null}
        {rail === "history" ? (
          <HistoryRail
            versions={versions}
            onSave={async () => {
              try {
                cancelPendingSaves();
                const content = editorRef.current?.getJSON() ?? undefined;
                const result = await saveVersion(id, { title, content });
                setVersions(visibleVersions(result.versions));
                setDoc((current) => (current ? { ...current, title, content: content ?? current.content } : current));
                setSaveState("saved");
                await refresh();
                toast.push("Checkpoint saved.");
              } catch (error) {
                toast.push(error instanceof ApiError ? error.message : "Could not save version.", "error");
              }
            }}
            onRestore={onRestore}
            onDelete={onDeleteVersion}
          />
        ) : null}
      </div>

      {shareOpen ? (
        <ShareDialog
          document={doc}
          isOwner={isOwner}
          onClose={() => setShareOpen(false)}
          onShare={share}
          onUnshare={unshare}
        />
      ) : null}
    </div>
  );
}
