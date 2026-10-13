import type { Editor } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered, MessageSquarePlus, Underline } from "lucide-react";

export function Toolbar({
  editor,
  onComment,
}: {
  editor: Editor | null;
  onComment?: () => void;
}) {
  if (!editor) return <div className="toolbar" />;

  const heading = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : editor.isActive("heading", { level: 3 })
        ? "3"
        : "p";

  return (
    <div className="toolbar" role="toolbar" aria-label="Text formatting">
      <select
        aria-label="Paragraph style"
        value={heading}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(value) as 1 | 2 | 3 }).run();
        }}
      >
        <option value="p">Body</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>
      <span className="toolbar-sep" />
      <button
        className={`icon-btn ${editor.isActive("bold") ? "is-active" : ""}`}
        type="button"
        aria-label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={15} />
      </button>
      <button
        className={`icon-btn ${editor.isActive("italic") ? "is-active" : ""}`}
        type="button"
        aria-label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={15} />
      </button>
      <button
        className={`icon-btn ${editor.isActive("underline") ? "is-active" : ""}`}
        type="button"
        aria-label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline size={15} />
      </button>
      <span className="toolbar-sep" />
      <button
        className={`icon-btn ${editor.isActive("bulletList") ? "is-active" : ""}`}
        type="button"
        aria-label="Bulleted list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={15} />
      </button>
      <button
        className={`icon-btn ${editor.isActive("orderedList") ? "is-active" : ""}`}
        type="button"
        aria-label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={15} />
      </button>
      {onComment ? (
        <>
          <span className="toolbar-sep" />
          <button className="icon-btn" type="button" aria-label="Add comment" onClick={onComment}>
            <MessageSquarePlus size={15} />
          </button>
        </>
      ) : null}
    </div>
  );
}
