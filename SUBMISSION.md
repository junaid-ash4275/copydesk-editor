# Copydesk — submission

Candidate: Muhammad Junaid Ashraf  
Assignment: Ajaia LLC — AI-Native Full Stack Developer  
Timebox: 4–6 hours

Copydesk is a shared writing desk for internal drafts: create, edit, import, comment, checkpoint, and hand the document to someone else. Owned work and shared work stay in separate lists. It is a coherent slice, not a Google Docs clone.

**Review the local app and the walkthrough video.** The live Vercel Hobby deploy is up but uses ephemeral SQLite per isolate, so sharing and version flows can fail there. Details are under [What is incomplete](#what-is-incomplete).

## Links

| Item | Value |
|---|---|
| Live product | https://copydesk-eta.vercel.app |
| Walkthrough video (2:58, recorded on localhost) | See `submission/VIDEO_URL.txt` after you upload `submission/Copydesk-walkthrough.mp4` |
| Local app | http://localhost:5173 (API on :4000, Vite proxies `/api`) |
| Source / docs | this repository |

## Test accounts

Password for all three: `demo1234`

| Name | Email | Role in the demo |
|---|---|---|
| Alex Okonkwo | alex@ajaia.dev | Owns the seeded documents |
| Blair Chen | blair@ajaia.dev | Already has *Q3 product notes* |
| Casey Romero | casey@ajaia.dev | No access — use to prove 403s |

## What this Drive folder / repo includes

- Source: `client/` (React + Vite + TipTap), `server/` (Express + Prisma + SQLite), `api/` (Vercel serverless wrapper)
- `README.md` — local setup and run
- `ARCHITECTURE.md` — what was prioritized and why
- `AI_WORKFLOW.md` — tools, speed-ups, rejections, verification
- `SUBMISSION.md` — this file
- `submission/LIVE_URL.txt` — live product URL
- `submission/VIDEO_URL.txt` — walkthrough URL (fill after upload)
- `submission/Copydesk-walkthrough.mp4` — 2:58 local recording with on-screen captions
- `submission/screenshots/` — login, editor, share dialog, Blair’s shared list
- `fixtures/product-notes.md` — sample import
- Automated tests: `server/tests/sharing.test.ts`, `server/tests/markdownToTiptap.test.ts`

No paid dependency. Reviewers can run the project with Node 20+ and `npm install`.

## How to review quickly

1. Watch `submission/Copydesk-walkthrough.mp4` (or the public URL once uploaded).
2. Run locally:

```bash
npm install
cd server && npx prisma db push && npm run db:seed && cd ..
npm run dev
```

Open http://localhost:5173. Sign in as Alex, then Blair.

3. `npm test` — markdown mapping + share access + session/version snapshots.
4. Optional: open https://copydesk-eta.vercel.app. Prefer local if a live click fails (see below).

## What works (local)

### Core (required)

| Requirement | What shipped |
|---|---|
| Create, rename, edit, save, reopen | New document, title field, TipTap body, debounced autosave, reopen from the list |
| Rich text | Bold, italic, underline, headings, bulleted and numbered lists |
| File upload | Import `.txt` or `.md` (2 MB max) as a **new** document. Limits are stated in the UI and README. Markdown headings, lists, bold, and italic map into the editor. |
| Sharing | Owner grants access by email. Home splits **My documents** and **Shared with me**. Collaborators edit the body only; rename, share, and delete stay with the owner. Casey gets 403. |
| Persistence | Prisma + SQLite. Content is TipTap JSON, so structure survives refresh. |
| Engineering bar | Validation (Zod + UI errors), `npm test`, architecture note, setup instructions |

### Stretch (optional, shipped)

- Presence heartbeats — who is on the document now
- Comments and suggestion-mode notes on a quoted span (separate rails)
- Version history: **Save version** is explicit; restore and delete
- Export Markdown from the API; PDF via the browser print dialog

## What is incomplete

**Live deploy (Vercel Hobby).** The UI and API share https://copydesk-eta.vercel.app so cookies stay first-party. The API is Express behind a serverless function. A seeded SQLite file is copied to `/tmp` on a cold start. Hobby does not pin one instance, so a later request can hit a different isolate with a different `/tmp` database. That showed up as: “Sign in to continue” on Save version, restore 404, and “Document not found” on a new-doc autosave. Signed session cookies and snapshot-based save/restore were added to reduce the damage; they do not make SQLite shared. **The walkthrough was recorded against the local process, which is the intended review path.**

**Walkthrough hosting.** The MP4 is in this repo. It is not yet a public Loom/YouTube/Drive URL until that file is uploaded and `submission/VIDEO_URL.txt` is filled.

**Not built (intentional).** CRDT / simultaneous typing, `.docx`, view-only roles, search, folders, OAuth.

## What I would build with another 2–4 hours

1. Put documents on a free shared store (Turso or Neon) so the live URL matches local behavior.
2. A view-only share role, now that owner vs can-edit is already split.
3. Host the walkthrough unlisted and drop the URL into the portal and `VIDEO_URL.txt`.

## Key implementation decisions

- **Split the repo.** HTTP, persistence, and UI are not one pile. Vite proxies `/api` locally so cookies are same-origin.
- **TipTap JSON, not HTML.** Formatting is structured and can round-trip to Markdown.
- **Seeded cookie auth.** Three users, one password. Sharing is demonstrable without OAuth.
- **Access is two roles.** Owner: read, edit, rename, share, delete. Shared: read and edit body. Anyone else: 403.
- **Versions are checkpoints.** A new version is created only when you click Save version — not on every keystroke.
- **Comments vs suggestions.** One `Comment` model with `kind`, two rails in the UI so they do not leak into each other.
- **Import creates a new document.** It does not overwrite an open draft.

## Walkthrough (what the video covers)

Recorded on http://localhost:5173 with captions (no voiceover).

1. Alex signs in; owned vs shared lists
2. Create, rename, rich text, autosave
3. Share *Reviewer walkthrough notes* with Blair
4. Import `fixtures/product-notes.md`
5. Comment vs Suggest on *Q3 product notes*; Save version; export
6. Sign in as Blair: both drafts under Shared with me; Shared badge; body edit

Intentionally deprioritized on camera: CRDT typing, `.docx`, extra roles. Those cuts are also in `ARCHITECTURE.md`.

## Tests

`npm test` covers:

- Markdown → TipTap mapping and Markdown export round-trip
- Owner shares → collaborator 200 + listed under shared → stranger 403
- Autosave PATCH materializes a missing document id
- Save version uses the title sent in the request
- Restore can apply a snapshot if the version row is gone
- Auth still works after the session row is deleted (signed cookie)

## AI workflow (short)

Tool: Cursor agent session.

Sped up: Express/Prisma layout, TipTap toolbar wiring, seed data, sharing test, React routing/API client, Vercel adapter, Playwright walkthrough script.

Changed or rejected: generic “AI SaaS” look (violet Tailwind / Inter / card grids) — replaced with IBM Plex + Source Serif 4, warm paper, dark sidebar. Rejected HTML blobs. Tightened sharing so collaborators cannot rename or reshare. Moved the title onto the page instead of an overlay. Recorded against localhost after the live isolate issues showed up.

Verified: `npm test`, browser create/rename/autosave, Blair’s shared list and Shared badge, Casey 403, Markdown import, walkthrough frames.

Full note: `AI_WORKFLOW.md`.
