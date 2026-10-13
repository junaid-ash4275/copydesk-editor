import type { User } from "../../api/types";
import { initials } from "../../lib/time";

export function PresenceAvatars({ viewers, selfId }: { viewers: User[]; selfId?: string }) {
  const others = viewers.filter((person) => person.id !== selfId);
  if (!others.length) return null;

  const names = others.map((person) => person.name);
  const label =
    names.length === 1 ? `${names[0]} is here` : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are here`;

  return (
    <div className="presence" title={label}>
      <div className="presence-stack">
        {others.slice(0, 4).map((person) => (
          <span key={person.id} className="avatar presence-avatar" title={person.name}>
            {initials(person.name)}
          </span>
        ))}
      </div>
      <span className="presence-label">{label}</span>
    </div>
  );
}
