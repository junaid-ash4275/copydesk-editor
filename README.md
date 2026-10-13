# Copydesk

Reviewers: start with [SUBMISSION.md](./SUBMISSION.md).

A shared writing desk: create, edit, import, comment, and pass a draft to someone else. Owned work and shared work stay in separate lists.

Also included: live presence on a document, suggestion notes, version history with restore, Markdown export, and PDF via the browser print dialog.

The repo is split on purpose:

- `client/` — React + Vite UI
- `server/` — Express API, Prisma, auth, sharing, import

## Demo accounts

Password for all three: `demo1234`

| Name | Email | Use |
|---|---|---|
| Alex Okonkwo | alex@ajaia.dev | Owns the seeded documents |
| Blair Chen | blair@ajaia.dev | Already has access to *Q3 product notes* |
| Casey Romero | casey@ajaia.dev | Has no shared access — use to prove 403s |

## Supported imports

`.txt` and `.md` only, up to 2 MB. Import creates a **new** document. Markdown headings, lists, bold, and italic are mapped into the editor. This limit is also shown in the UI.

## Local setup

Requires Node 20+.

```bash
npm install
cd server && npx prisma db push && npm run db:seed && cd ..
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` to the Express process on port 4000.

```bash
npm test
```

## Production-style run

```bash
npm run build
NODE_ENV=production DATABASE_URL="file:./dev.db" npm start
```

The API serves `client/dist` when `NODE_ENV=production`.

## Deploy (Vercel Hobby)

The UI and API share one Vercel URL so session cookies stay first-party. The API is the Express app behind a serverless function. A seeded SQLite file is copied to `/tmp` on a cold start.

```bash
npx vercel login
npx vercel --prod --yes
```

Sign in with `alex@ajaia.dev` / `demo1234`.
