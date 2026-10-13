# AI workflow

## Tools

Cursor (agent session) for scaffolding, implementation, and in-browser verification.

## Where it sped things up

- Express + Prisma layout (routes, services, session cookies)
- TipTap toolbar wiring
- Seed data and the sharing HTTP test
- Boilerplate React routing and the API client

## What was changed or rejected

- Rejected a generic “AI SaaS” look (violet Tailwind, Inter-only, card grids, pill buttons). The UI is a custom editorial system: IBM Plex + Source Serif 4, warm paper, dark sidebar, 3px corners.
- Rejected storing HTML blobs. Content is TipTap JSON so formatting is structured.
- Tightened sharing: owner-only rename/share/delete; collaborators edit body only.
- Moved the document title onto the page instead of an absolutely positioned overlay the model first produced.

## How it was verified

- `npm test` — markdown mapping + share access (owner share → collaborator 200 → stranger 403)
- Typed create / rename / edit / autosave in the browser
- Logged in as Blair and confirmed owned vs shared lists and the Shared badge
- Logged in as Casey against Alex’s document and confirmed 403
- Imported `fixtures/product-notes.md` through the API
