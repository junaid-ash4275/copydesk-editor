import { describe, expect, it } from "vitest";
import { markdownToTiptap, textToTiptap, tiptapToMarkdown } from "../src/lib/tiptap.js";

describe("markdownToTiptap", () => {
  it("maps headings, lists, and emphasis into a TipTap document", () => {
    const doc = markdownToTiptap(`# Title

A **bold** note.

- Alpha
- Beta

1. First
`);

    expect(doc.type).toBe("doc");
    expect(doc.content?.[0]).toMatchObject({ type: "heading", attrs: { level: 1 } });
    expect(doc.content?.[1]?.content?.some((node) => node.marks?.[0]?.type === "bold")).toBe(true);
    expect(doc.content?.[2]).toMatchObject({ type: "bulletList" });
    expect(doc.content?.[3]).toMatchObject({ type: "orderedList" });
  });
});

describe("tiptapToMarkdown", () => {
  it("round-trips headings, emphasis, and lists", () => {
    const markdown = tiptapToMarkdown(
      markdownToTiptap(`# Title

A **bold** note.

- Alpha
`),
    );
    expect(markdown).toContain("# Title");
    expect(markdown).toContain("**bold**");
    expect(markdown).toContain("- Alpha");
  });
});

describe("textToTiptap", () => {
  it("splits plain text on blank lines", () => {
    const doc = textToTiptap("Hello\n\nWorld");
    expect(doc.content).toHaveLength(2);
    expect(doc.content?.[0]?.content?.[0]?.text).toBe("Hello");
  });
});
