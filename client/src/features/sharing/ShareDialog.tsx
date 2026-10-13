import { FormEvent, useState } from "react";
import { Dialog } from "../../ui/Dialog";
import type { DocumentDetail } from "../../api/types";
import { initials } from "../../lib/time";

type ShareDialogProps = {
  document: DocumentDetail;
  isOwner: boolean;
  onClose: () => void;
  onShare: (email: string) => Promise<void>;
  onUnshare: (userId: string) => Promise<void>;
};

export function ShareDialog({ document, isOwner, onClose, onShare, onUnshare }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onShare(email);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      title="Share document"
      description="Anyone with access can edit. Only the owner can change who is on the document."
      onClose={onClose}
    >
      {isOwner ? (
        <form onSubmit={submit}>
          <div className="share-form">
            <label className="field">
              <span>Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="blair@ajaia.dev"
                type="email"
                required
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Grant access
            </button>
          </div>
        </form>
      ) : (
        <p>You can edit this document. Ask the owner if you need someone else added.</p>
      )}
      {error ? <p className="err">{error}</p> : null}

      <div className="people">
        {document.collaborators.map((person) => (
          <div className="person" key={person.id}>
            <span className="avatar avatar-lg">{initials(person.name)}</span>
            <div className="person-copy">
              <strong>{person.name}</strong>
              <span className="person-email">{person.email}</span>
            </div>
            <span className={person.role === "owner" ? "badge" : "badge badge-muted"}>
              {person.role === "owner" ? "Owner" : "Can edit"}
            </span>
            {isOwner && person.role !== "owner" ? (
              <button className="btn btn-ghost" type="button" onClick={() => void onUnshare(person.id)}>
                Remove
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>
      <div className="dialog-actions">
        <button className="btn btn-secondary" type="button" onClick={onClose}>
          Done
        </button>
      </div>
    </Dialog>
  );
}
