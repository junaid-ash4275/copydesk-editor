import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Toolbar } from "./Toolbar";

type DocumentEditorProps = {
  content: Record<string, unknown>;
  title: string;
  titleLocked: boolean;
  onTitleChange: (title: string) => void;
  onChange: (content: Record<string, unknown>) => void;
  onComment: () => void;
};

export type DocumentEditorHandle = {
  selectedQuote: () => string;
  getJSON: () => Record<string, unknown> | null;
};

export const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(
  function DocumentEditor(
    { content, title, titleLocked, onTitleChange, onChange, onComment },
    ref,
  ) {
    const skipFirstUpdate = useRef(true);
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Underline,
        Placeholder.configure({ placeholder: "Start writing…" }),
      ],
      content,
      editorProps: {
        attributes: {
          spellcheck: "true",
        },
      },
      onUpdate: ({ editor: instance }) => {
        if (skipFirstUpdate.current) {
          skipFirstUpdate.current = false;
          return;
        }
        onChange(instance.getJSON());
      },
    });

    useImperativeHandle(ref, () => ({
      selectedQuote() {
        if (!editor) return "";
        const { from, to } = editor.state.selection;
        if (from === to) return "";
        return editor.state.doc.textBetween(from, to, " ").trim();
      },
      getJSON() {
        return editor ? (editor.getJSON() as Record<string, unknown>) : null;
      },
    }));

    return (
      <>
        <Toolbar editor={editor} onComment={onComment} />
        <div className="canvas">
          <div className="sheet">
            <input
              className="title-input"
              value={title}
              disabled={titleLocked}
              aria-label="Document title"
              placeholder="Untitled"
              onChange={(event) => onTitleChange(event.target.value)}
            />
            <div className="sheet-body">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </>
    );
  },
);
