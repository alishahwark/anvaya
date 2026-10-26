# Anvaya compliance audit

Audit date: 2026-10-25. The course URL was unavailable in this environment; the user-provided checklist is authoritative. This document records observed implementation evidence and does not convert planned work into a pass.

## Submission and reproducibility

| Requirement | Result | Evidence |
|---|---|---|
| Complete working application in a GitHub-ready directory | PASS | `app/`, `components/`, `db/`, `lib/`, `data/`, `tests/`, `package.json` |
| Fresh clone setup under 10 minutes | NOT VERIFIED | README has commands; no timed fresh-clone run or remote clone was performed |
| Self-contained `report.html` | PARTIAL | `report.html` is standalone and uses inline CSS/SVG; student/repository links and screenshots remain placeholders |
| Report exact eight-section order | PASS | `report.html` has the eight required headings in order |
| Report prints 10–15 US Letter pages | NOT VERIFIED | CSS is configured for US Letter and expanded sections, but no PDF/page-count inspection was run |
| Self-contained slides, max 10 slides | PASS | `slides.html` contains 9 inline slides, CSS, SVG, and JavaScript navigation |
| Arrow-key slide navigation | PASS | `slides.html` handles ArrowLeft, ArrowRight, and Space |
| No secrets/build output/database committed | PASS | `anvaya/.gitignore`; `.env`, `node_modules`, `.next`, logs, and `data/*.db` are ignored. Git status shows `anvaya/` untracked as a directory, not ignored-file contents |

## Application

| Requirement | Result | Evidence |
|---|---|---|
| Responsive professional interface | PASS | `app/page.tsx`, `app/globals.css`, responsive Tailwind classes; Playwright homepage smoke test |
| Local SQLite migration and seed | PASS | `db/migrations/0000_initial.sql`, `scripts/migrate.ts`, `db/seed.ts`; `npm run db:migrate` and `npm run db:seed` passed |
| Small offline test dataset | PASS | `data/fixtures/seed-data.ts`; `tests/env.test.ts` |
| Repository `.env` before parent `.env` | PASS | `lib/env.ts`; merge order is parent, process environment, then project `.env` |
| `PORTKEY_API_KEY` with only `gpt-6-luna` | PASS | `lib/env.ts` selects `gpt-6-luna` for Portkey; `app/api/interpret/route.ts` passes that model |
| Personal `OPENAI_API_KEY` path | PASS | `lib/env.ts` supports `OPENAI_API_KEY` and `OPENAI_MODEL` without changing the Portkey model path |
| Real frontend-to-backend AI workflow | PASS | `components/chat/InterpretationForm.tsx` calls `/api/interpret`; local live smoke request returned an AI interpretation |
| Database-backed evidence path | PASS | Offline importer, verified source rows, page excerpts, provision schedules, and approved events are persisted in `data/anvaya.db`; the static policy page consumes the same verified fixture contract for reproducible rendering |

## Anvaya-specific capabilities

| Capability | Result | Evidence |
|---|---|---|
| Search/discovery of Indian legislation | PARTIAL | `/explore` and `PolicySearch.tsx` search one local fixture; no broad legislation ingestion exists |
| Parliamentary lifecycle tracking | PARTIAL | `milestones` schema and one verified/unverified fixture milestone; no live parliamentary ingestion or completeness evidence |
| Proposed bills vs enacted Acts vs commenced provisions | PASS for DPDP case | `legislative_events`, `policy_provisions`, deterministic status engine, and approved `partially_commenced` event distinguish assent from provision commencement |
| Source-backed AI explanations | PASS for DPDP case | `/api/interpret` retrieves ranked excerpts from the three verified local PDFs and returns document-level citation metadata |
| Stakeholder and impact analysis | PARTIAL | Existing impact agent and explorer produce labeled analysis; quantitative outcomes and user-impact measurements are intentionally absent |
| Official government-source citations | PASS for imported DPDP documents | Three verified MeitY PDFs, SHA-256 hashes, page excerpts, and source locators are present |
| Agent execution logs | PASS | `lib/agents/audit-log.ts`; successful API calls write JSONL records under ignored `data/logs/` |
| Measured token usage | PASS for instrumentation and one trace | `data/benchmarks/agent-trace-2026-10-24.json` records one real smoke execution; no pricing/cost calculation exists |
| Prompt injection defense | PARTIAL | Zod bounds and untrusted-content delimiters/instructions exist; no adversarial test fixture has been run and stored |
| Fabricated legal-status defense | PASS for status updates; PARTIAL for semantic claims | Only verified event approval can update status; AI citations are deterministically checked, while semantic claim support still requires review |

## Report rubric evidence

| Rubric area | Result | Evidence gap |
|---|---|---|
| Novelty/value, motivation, differentiation | PARTIAL | Documented in report; no user research or competitor study |
| Working application and runnability | PASS | Typecheck, Vitest, Playwright, build, migration, seed, homepage, and API smoke checks passed |
| UI/UX | PASS for prototype | No usability study |
| Agent architecture | PARTIAL | One working interpreter route; no multi-agent orchestration |
| Tokenomics | NOT VERIFIED | No pricing source, workload, cost, or quality trade-off measurements |
| Safety | PARTIAL | Technical boundaries exist; no adversarial evidence screenshot/test artifact |
| Impact | NOT VERIFIED | No user test, accuracy, time-savings, or usefulness measurement |
| Report/slides | PARTIAL | Standalone files and required structure exist; screenshots, identity/repository links, and final print/page audit remain |

## Verification commands

Run from `anvaya/`:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run dev
```

For the Playwright test on a new machine, install its browser once with `npx playwright install chromium`.

## Highest-impact remaining work

1. Add verified document-level official sources and a source-preserving ingestion/review path.
2. Model proposal, enactment, rules, and commencement as distinct statuses.
3. Add a real stakeholder/impact evidence workflow.
4. Capture actual API traces, pricing, costs, and quality measurements.
5. Run an adversarial prompt-injection/status-hallucination test and retain the evidence.
6. Add real user testing and embed real screenshots; fill report identity and repository links.

## Phase 5 verification update

- Offline source import: PASS; three files imported once, later rerun reported 3 hash duplicates and 0 errors.
- Source identity and page extraction: PASS; 21 + 2 + 41 pages and 64 excerpts are present.
- DPDP commencement date tests: PASS; 14 unit tests pass overall.
- Policy detail page: PASS; a real browser screenshot is at `docs/screenshots/dpdp-policy-page.png` and the route contains separate Act and Rules schedules.
- Source-backed event workflow: PASS for assent and Group A partial commencement; both are verified events linked to imported PDFs.
- Real explanation call: PASS; Portkey `gpt-6-luna`, 5,706 input / 1,300 output / 7,006 total tokens, 9,683 ms, valid citation IDs.
- Semantic citation support: PARTIAL; deterministic checks pass, but the system correctly requires semantic/human review rather than claiming certainty.
- December 2025 Rules corrigendum: NOT VERIFIED; no local file available.
