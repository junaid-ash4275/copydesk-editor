import { useEffect } from "react";

type DialogProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Dialog({ title, description, onClose, children }: DialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose} role="presentation">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
