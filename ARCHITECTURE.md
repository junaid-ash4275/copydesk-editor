# Architecture

Copydesk is a shared writing desk: create, edit, import, comment, and pass a draft to someone else. The repo is split so HTTP, persistence, and UI do not sit in one pile.

```
client/   React + Vite. Pages, design system, TipTap editor, API client.
server/   Express. Routes → services → Prisma. Auth, documents, sharing, import.
```

## Why this slice

The assignment rewards a coherent product under a timebox, not a Google Docs clone. The depth is in:

1. An editing surface that feels like a document, not a form
2. Ownership vs shared access that you can actually demonstrate
3. Persistence that keeps formatting after refresh

Stretch features in this slice:

- Presence heartbeats (who is on the document now)
- Comments and suggestion-mode notes on a text quote
- Version history with restore
- Export to Markdown, and PDF via the browser print dialog

Left out on purpose: CRDT co-editing, `.docx`, and role granularity beyond owner / can-edit.

## Stack

| Layer | Choice | Reason |
|---|---|---|
| UI | React + Vite | Fast local loop, separate from the API |
| Editor | TipTap | Headings, bold/italic/underline, lists without a custom contenteditable |
| API | Express | Thin HTTP over services that can be tested without the UI |
| Auth | HttpOnly session cookie + three seeded users | Sharing is demonstrable without OAuth |
| Data | Prisma + SQLite | Documents and shares survive refresh; no paid dependency |

## Data

- `User` owns `Document`s and can be granted `Share`s
- Document `content` is TipTap JSON (stringified) so structure survives round-trips
- Sessions expire; logout deletes the row and clears the cookie

Access rules:

- Owner: read, edit, rename, share, delete
- Shared collaborator: read and edit body only
- Anyone else: 403

## File import

`.txt` and `.md`, 2 MB max. Import creates a **new** document. Markdown is mapped server-side into TipTap JSON (headings, lists, bold, italic). Limits are stated in the UI and README.

## Runtime

Locally, Vite proxies `/api` to Express on port 4000 so cookies are same-origin. In production the API can serve `client/dist`.
