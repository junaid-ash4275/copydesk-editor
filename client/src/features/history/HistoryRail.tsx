import { Trash2 } from "lucide-react";
import type { DocVersion } from "../../api/types";
import { relativeTime } from "../../lib/time";

type HistoryRailProps = {
  versions: DocVersion[];
  onSave: () => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function HistoryRail({ versions, onSave, onRestore, onDelete }: HistoryRailProps) {
  return (
    <aside className="rail">
      <div className="rail-head">
        <h2>Version history</h2>
        <button className="btn btn-secondary" type="button" onClick={() => void onSave()}>
          Save version
        </button>
      </div>
      <p className="helper" style={{ padding: "0 16px 12px" }}>
        Versions are created only when you click Save version. Restore loads that snapshot into the live document without adding a new one.
      </p>
      <div className="comment-list">
        {versions.length === 0 ? (
          <p className="helper">No versions yet. Click Save version to keep a checkpoint.</p>
        ) : (
          versions.map((version) => (
            <article key={version.id} className="comment-card">
              <div className="comment-meta">
                <div className="grow">
                  <strong>{version.title}</strong>
                  <span className="meta-cell">
                    {relativeTime(version.createdAt)} · {version.createdBy.name}
                  </span>
                </div>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={`Delete version from ${relativeTime(version.createdAt)}`}
                  onClick={() => void onDelete(version.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <button className="btn btn-ghost" type="button" onClick={() => void onRestore(version.id)}>
                Restore
              </button>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
