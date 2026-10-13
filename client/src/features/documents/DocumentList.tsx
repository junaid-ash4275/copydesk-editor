import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import type { DocumentSummary } from "../../api/types";
import { relativeTime } from "../../lib/time";

type DocumentListProps = {
  title: string;
  empty: string;
  documents: DocumentSummary[];
  onDelete?: (doc: DocumentSummary) => void;
};

export function DocumentList({ title, empty, documents, onDelete }: DocumentListProps) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {documents.length === 0 ? (
        <div className="empty">{empty}</div>
      ) : (
        <div className="doc-table">
          {documents.map((doc) => (
            <article key={doc.id} className="doc-row">
              <Link to={`/d/${doc.id}`} className="doc-main">
                <strong>{doc.title}</strong>
                <span className="meta-cell">{doc.owner.name}</span>
                <span className="meta-cell">{relativeTime(doc.updatedAt)}</span>
              </Link>
              {onDelete && doc.role === "owner" ? (
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={`Delete ${doc.title}`}
                  onClick={() => onDelete(doc)}
                >
                  <Trash2 size={15} />
                </button>
              ) : (
                <span />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
