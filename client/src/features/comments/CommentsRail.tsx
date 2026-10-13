import { FormEvent, useState } from "react";
import type { CommentKind, DocComment } from "../../api/types";
import { initials, relativeTime } from "../../lib/time";

type CommentsRailProps = {
  comments: DocComment[];
  quote: string;
  kind: CommentKind;
  onClearQuote: () => void;
  onSubmit: (input: { body: string; quote?: string; kind: CommentKind }) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
};

export function CommentsRail({
  comments,
  quote,
  kind,
  onClearQuote,
  onSubmit,
  onResolve,
}: CommentsRailProps) {
  const isSuggestion = kind === "suggestion";
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const visible = comments.filter(
    (comment) => comment.kind === kind && (showResolved ? comment.resolved : !comment.resolved),
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        body,
        quote: quote || undefined,
        kind,
      });
      setBody("");
      onClearQuote();
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rail">
      <div className="rail-head">
        <h2>{isSuggestion ? "Suggestions" : "Comments"}</h2>
        <button className="btn btn-ghost" type="button" onClick={() => setShowResolved((value) => !value)}>
          {showResolved ? "Open" : "Resolved"}
        </button>
      </div>
      <form className="comment-form" onSubmit={(event) => void submit(event)}>
        {quote ? (
          <p className="quote">
            “{quote}”
            <button className="btn btn-ghost" type="button" onClick={onClearQuote}>
              Clear
            </button>
          </p>
        ) : (
          <p className="helper">
            {isSuggestion
              ? "Select text, then propose a change. Suggestions stay separate from comments."
              : "Select text in the document, then comment — or leave a note on the whole draft."}
          </p>
        )}
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={isSuggestion ? "Propose a change…" : "Write a comment…"}
          rows={3}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {isSuggestion ? "Suggest" : "Comment"}
        </button>
      </form>
      <div className="comment-list">
        {visible.length === 0 ? (
          <p className="helper">{showResolved ? "No resolved threads." : "No open threads yet."}</p>
        ) : (
          visible.map((comment) => (
            <article key={comment.id} className="comment-card">
              <div className="comment-meta">
                <span className="avatar">{initials(comment.author.name)}</span>
                <div className="grow">
                  <strong>{comment.author.name}</strong>
                  <span className="meta-cell">{relativeTime(comment.createdAt)}</span>
                </div>
                {isSuggestion ? <span className="badge">Suggestion</span> : null}
              </div>
              {comment.quote ? <p className="quote">“{comment.quote}”</p> : null}
              <p>{comment.body}</p>
              <button className="btn btn-ghost" type="button" onClick={() => void onResolve(comment.id)}>
                {comment.resolved ? "Reopen" : "Resolve"}
              </button>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
