# Anvaya

Anvaya is an independent, citizen-first public policy intelligence application for understanding Indian legislative proposals and enacted law. It is not affiliated with the Government of India.

## Run locally

```bash
npm install
npm run db:migrate
npm run db:seed
npm run data:import
npm run dev
```

Open http://localhost:3000. The seeded experience does not require a network connection or an API key. To enable optional interpretation, copy `.env.example` to `.env` and set `PORTKEY_API_KEY`; the app reads the repository `.env` first, then the parent directory `.env`. Never commit `.env`.

Useful checks: `npm run typecheck`, `npm test`, `npm run build`, and `npm run start`. Run all commands from this `anvaya/` directory.

The only model configured by the interpretation route is the course-approved `gpt-6-luna` through Portkey and the Responses API. Official evidence is stored separately from AI interpretation. The initial records are versioned local fixtures and should be replaced or extended only through ingestion adapters that preserve exact official source URLs.

`npm run data:import` runs the offline, deduplicating legislative import. It intentionally leaves records unverified when document-level government sources are unavailable. A live refresh is not enabled because the listed government sites were unreachable during this build and no unsupported API endpoint is assumed.

For manually downloaded documents, place PDFs/HTML in `data/source-inbox/` with the documented JSON sidecar and run `npm run data:import:files`. Review excerpts, then use `npm run data:verify:source -- --document-id <id>` followed by `npm run data:approve:event -- --event-id <id>` only after a human confirms the source and permitted status transition.

## Environment resolution

The app reads `PORTKEY_API_KEY` from `anvaya/.env` first, then `my-app/.env` (the parent directory). In a standalone clone, this becomes the project-root `.env`, then its parent `.env`. `.env` files are ignored and `.env.example` contains no secret.

## Project map

`app/` contains the Next.js routes and API; `components/` contains UI and the evidence-grounded question form; `db/` contains the schema, migration SQL, and seed entrypoint; `data/fixtures/` contains the small offline fixture; `lib/` contains evidence, policy, ingestion, and agent boundaries; `tests/` contains unit and Playwright tests; `report.html` and `slides.html` are standalone submission deliverables.

## Submission checklist

The app is self-contained under this directory, has no required external database, can be seeded offline, and keeps API credentials out of Git. Before publishing, run the commands above from a fresh clone and populate the report with final project-specific results.
