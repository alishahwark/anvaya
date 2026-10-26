# Legislative data implementation report

## Actual local records

The local register contains six records: one Digital Personal Data Protection Act, 2023 record and five requested candidate records: Indian Statistical Institute Bill, 2026; Securities Markets Code, 2025; MSME Development Amendment Bill, 2026; National Sports Governance Bill, 2025; and a reserved 2026 government draft-policy slot.

The five candidates remain `unverified` because no authentic local source files were available for them. The DPDP record is now verified from three imported MeitY PDFs: Act No. 22 of 2023 (21 pages), G.S.R. 843(E) commencement notification (2 pages), and G.S.R. 846(E) Rules (41 pages). Their SHA-256 hashes are stored in the database and 64 page excerpts were created. Four timeline events are source-linked and verified, including assent and the approved Group A partial commencement event. Six provision schedule rows distinguish the Act from the Rules. The December 2025 Rules corrigendum was not found and is explicitly unresolved.

## Functional integrations

- Local fixture import: implemented and reproducible with `npm run data:import`.
- Government live retrieval: not attempted repeatedly because DNS/network access was restricted; no unsupported endpoint or bypass was introduced. The reproducible integration is local inbox import.
- Source metadata: implemented in `source_documents` with URL, publisher, type, locator, retrieval/verification fields, and content hash field.
- Timeline: implemented from `legislative_events`, with verified/unverified state and status validation.
- Judicial developments: normalized table and explicit no-automatic-stay rule; no court record seeded without evidence.
- AI: retrieves a bounded, query-ranked subset of indexed DPDP excerpts, returns document-level citations and token/latency telemetry, and cannot update status. A live explanation smoke run used 5,706 input, 0 cached-input, 1,300 output, and 7,006 total tokens in 9,683 ms with Portkey `gpt-6-luna`.

## Schema additions

`source_documents`, `legislative_policies`, `legislative_events`, `legislative_versions`, `policy_provisions`, `judicial_developments`, `ingestion_runs`, and `ingestion_reviews` were added in `db/migrations/0001_legislative_tracking.sql`.

## Commands

```bash
npm run db:migrate
npm run db:seed
npm run data:import
npm run typecheck
npm test
npm run build
```

The importer is idempotent: the latest rerun reported 3 duplicate hashes and 0 errors. Source verification and event approval remain separate commands. `docs/screenshots/dpdp-policy-page.png` is a real browser capture of the evidence-backed DPDP route. Citation ID checks passed in the live API response; semantic support correctly remains reviewable rather than guaranteed.
