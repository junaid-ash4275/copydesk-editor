export type TiptapMark = { type: string; attrs?: Record<string, unknown> };

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};

export function emptyDoc(): TiptapNode {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function parseDoc(raw: string): TiptapNode {
  try {
    const parsed = JSON.parse(raw) as TiptapNode;
    if (parsed && parsed.type === "doc") return parsed;
  } catch {
    /* fall through */
  }
  return emptyDoc();
}

export function serializeDoc(doc: TiptapNode) {
  return JSON.stringify(doc);
}

function textNode(text: string, marks?: TiptapMark[]): TiptapNode {
  return marks?.length ? { type: "text", text, marks } : { type: "text", text };
}

function paragraph(text: string): TiptapNode {
  if (!text) return { type: "paragraph" };
  return { type: "paragraph", content: [textNode(text)] };
}

function heading(level: 1 | 2 | 3, text: string): TiptapNode {
  return {
    type: "heading",
    attrs: { level },
    content: text ? [textNode(text)] : undefined,
  };
}

function listItem(text: string): TiptapNode {
  return {
    type: "listItem",
    content: [paragraph(text)],
  };
}

function inlineMarkdown(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(textNode(text.slice(last, match.index)));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(textNode(token.slice(2, -2), [{ type: "bold" }]));
    } else if (token.startsWith("*") || token.startsWith("_")) {
      nodes.push(textNode(token.slice(1, -1), [{ type: "italic" }]));
    } else {
      nodes.push(textNode(token.slice(1, -1), [{ type: "code" }]));
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(textNode(text.slice(last)));
  return nodes.length ? nodes : [textNode(text)];
}

function richParagraph(text: string): TiptapNode {
  if (!text) return { type: "paragraph" };
  return { type: "paragraph", content: inlineMarkdown(text) };
}

export function textToTiptap(text: string): TiptapNode {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const content = blocks.map((block) => paragraph(block.replace(/\n/g, " ").trim()));
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

export function markdownToTiptap(markdown: string): TiptapNode {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const content: TiptapNode[] = [];
  let bulletItems: TiptapNode[] = [];
  let orderedItems: TiptapNode[] = [];

  const flushLists = () => {
    if (bulletItems.length) {
      content.push({ type: "bulletList", content: bulletItems });
      bulletItems = [];
    }
    if (orderedItems.length) {
      content.push({ type: "orderedList", content: orderedItems });
      orderedItems = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    const bulletMatch = /^[-*]\s+(.*)$/.exec(line);
    const orderedMatch = /^\d+\.\s+(.*)$/.exec(line);

    if (headingMatch) {
      flushLists();
      const level = headingMatch[1].length as 1 | 2 | 3;
      content.push(heading(level, headingMatch[2].trim()));
      continue;
    }
    if (bulletMatch) {
      if (orderedItems.length) flushLists();
      bulletItems.push(listItem(bulletMatch[1]));
      continue;
    }
    if (orderedMatch) {
      if (bulletItems.length) flushLists();
      orderedItems.push(listItem(orderedMatch[1]));
      continue;
    }
    if (!line.trim()) {
      flushLists();
      continue;
    }
    flushLists();
    content.push(richParagraph(line.trim()));
  }

  flushLists();
  if (!content.length) content.push({ type: "paragraph" });
  return { type: "doc", content };
}

export function titleFromFilename(filename: string) {
  return filename.replace(/\.(md|txt)$/i, "").replace(/[-_]+/g, " ").trim() || "Imported document";
}

function inlineToMarkdown(nodes: TiptapNode[] | undefined): string {
  if (!nodes?.length) return "";
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (node.type === "text") {
        let text = node.text ?? "";
        const marks = new Set((node.marks ?? []).map((mark) => mark.type));
        if (marks.has("code")) text = `\`${text}\``;
        if (marks.has("bold")) text = `**${text}**`;
        if (marks.has("italic")) text = `*${text}*`;
        if (marks.has("underline")) text = `<u>${text}</u>`;
        return text;
      }
      if (node.content) return inlineToMarkdown(node.content);
      return "";
    })
    .join("");
}

function blockToMarkdown(node: TiptapNode): string {
  switch (node.type) {
    case "heading": {
      const level = Math.min(Number(node.attrs?.level ?? 1), 3);
      return `${"#".repeat(level)} ${inlineToMarkdown(node.content)}`;
    }
    case "paragraph":
      return inlineToMarkdown(node.content);
    case "bulletList":
      return (node.content ?? [])
        .map((item) => `- ${inlineToMarkdown(item.content?.[0]?.content ?? item.content)}`)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((item, index) => `${index + 1}. ${inlineToMarkdown(item.content?.[0]?.content ?? item.content)}`)
        .join("\n");
    case "blockquote":
      return (node.content ?? [])
        .map((child) => `> ${blockToMarkdown(child)}`)
        .join("\n");
    default:
      return inlineToMarkdown(node.content) || (node.content ?? []).map(blockToMarkdown).join("\n\n");
  }
}

export function tiptapToMarkdown(doc: TiptapNode): string {
  const blocks = (doc.content ?? []).map(blockToMarkdown).filter((block) => block.trim().length);
  return `${blocks.join("\n\n")}\n`;
}
