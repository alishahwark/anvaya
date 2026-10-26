# Implementation gap register

Audit and rebuild of 25 October 2026, against the Anvaya master product blueprint. Statuses: **WORKING** (observed end to end), **PARTIAL** (works, with a named gap), **BROKEN**, **UNVERIFIED** (not tested or cannot be), **DEFERRED** (consciously not built). Evidence means a test or a saved result file, not a claim.

Older files in `docs/` (QA results, visual specs, the earlier `product-audit.md`) describe previous builds. Pre-rebuild copies of `report.html`, `slides.html`, `README.md` and `.env.example` are in `docs/archive/`.

## What the audit found at the start

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Policy "brief" and "what changes" described the app's import process, not the law | High | Rewritten from the official text, each statement tied to quotes (`lib/knowledge/`) |
| 2 | Raw enums (`effective_on_schedule`), repeated status pills, "Analysis activity · completed" shown to citizens | High | Removed; one plain status; a browser test asserts no enum names appear |
| 3 | Stakeholder analysis depended on live AI and showed nothing without it | High | Six policy-specific groups from verified law, no AI needed |
| 4 | Unrelated CPI data advertised on the DPDP page | Medium | Removed from policy pages; Evidence Lab stays separate and labelled descriptive |
| 5 | December 2025 corrigendum missing from sources | High | Downloaded from MeitY, imported, verified, linked |
| 6 | Removal of Difficulties Order (S.O. 5458(E), 6 Oct 2026) unknown to the app | High | Found on the web, downloaded, imported, shown in the legal journey |
| 7 | Source fetcher validated redirects only after following them (SSRF gap) | High | Every hop validated before it is requested; 14 tests |
| 8 | Repeated research searches created duplicate policy records, named after the query | Medium | Reuse by source document; read layer collapses old duplicates; named after the document |
| 9 | Sansad dates in DD/MM/YYYY mixed with ISO | Low | Normalised in `lib/research/record.ts` |
| 10 | `/api/interpret` and `/api/research` unbounded | Medium | Rate limits; legacy route off by default |
| 11 | Five placeholder "candidate" policies listed with no data | Medium | Not listed; real searches replaced them (see A) |
| 14 | Researched records were labelled "not independently verified" and answers treated Parliament's assent as an unverified candidate | High | Verification engine: stage from Parliament's record, checked against the documents and India Code, every check shown |
| 15 | "Answer could not be read" on broad questions (truncated model output) | High | Retry at a larger budget; exact-quote requirement; abstentions now suggest what the document does cover |
| 16 | Page numbers for researched documents were chunk numbers, not real pages | High | Engine stores true per-page text |
| 17 | A shared generic word ("amendment") could match the wrong bill; the register's search is whitespace-sensitive; withdrawn predecessors outranked the enacted law | High | Distinctive-word matching, all query variants in parallel, "went furthest" tie-break, alternatives shown |
| 12 | `report.html` / `slides.html` were skeletal, with no reveal.js, no images, placeholders | High | Rebuilt from result files by `scripts/build-submission.ts` |
| 13 | Model name `gpt-6-luna` in code vs `gpt-5.6-luna` in `AGENTS.md` | Decision | Defaulted to `gpt-6-luna` (course rule); see "Needs your decision" |

## Gates and modules

| Area | Status | Where | Reproduce | Evidence / note | Pri |
|---|---|---|---|---|---|
| **Gate 0** Backup + inventory | PARTIAL | `data/backups/gate0-*` | `ls data/backups` | SQLite backed up before changes. **No git checkpoint**: `anvaya/` is untracked and nothing was committed | P0 |
| **A** Policy discovery: Sansad adapter | WORKING | `lib/research/adapters.ts` | Explore → search "Securities Markets Code" | 4 of 5 searches found an official PDF; MSME bill returned none and no record was made | P0 |
| **A2** Verification engine (names → official records) | WORKING | `lib/engine/` | Explore → type a bill or Act name | Searches Parliament's register + India Code, fetches every official version, runs explicit checks (shown to the reader). 22 records re-verified: 5 corroborated, 17 verified, 0 failed. 100+ unit tests incl. failure cases | P0 |
| A2: second-source corroboration | PARTIAL | `lib/engine/indiacode.ts` | Open an enacted bill | India Code does not list many amending Acts and sometimes has wrong metadata (shown, not hidden); eGazette is behind a captcha and not searched | P1 |
| A2: commencement / later amendments | UNVERIFIED | `verify-bill.ts` | — | The Act's own start-date clause is quoted; notifications setting later dates and later amendments are not checked | P1 |
| A: ask for any document by link | WORKING | `lib/research/adapters.ts` (`officialUrlAdapter`) | Explore → paste an official PDF link | Allowlisted hosts only; tested with the draft DPDP Rules (51 pages) and hostile links | P0 |
| A: name search beyond Parliament (India Code, eGazette, MeitY, PIB) | DEFERRED | — | — | Hosts are allowlisted for links, but no name-search adapter exists, so non-bill laws need a pasted link | P1 |
| **F2** Analysis of any retrieved document | WORKING | `lib/analysis/generate.ts`, `components/policy/DocumentAnalysis.tsx` | Open a provisional record | Brief, changes, affected groups, each checked; 6 stored analyses: see report §7. Long documents use 14 passages, so coverage is partial; scanned PDFs unreadable | P0 |
| A: safe fetch, hash, dedup | WORKING | `lib/research/security.ts`, `service.ts` | `npm test` | 14 security tests; rerun of "Waqf" reused its record | P0 |
| A: coverage / completeness checks | PARTIAL | `lib/knowledge/dpdp.ts` `watch` | Open DPDP → Things to watch | Gaps are listed by hand; no automatic detector for newer notifications. eGazette not read directly | P1 |
| **B** Status and commencement | WORKING | `lib/knowledge/index.ts` | `npm test` (status tests) | Computed from dates and as-of; Act and Rules schedules separate; 25 Oct 2026 = "partly in force" | P0 |
| B: judicial developments, amendments feed | DEFERRED | — | — | Only the corrigendum and the 2026 Order are modelled | P2 |
| B: one-day counting ambiguity | UNVERIFIED | `watch` item | — | Shown to readers as unconfirmed; needs an authority | P1 |
| **C** Evidence → claim layer | WORKING (DPDP) | `lib/knowledge/dpdp-claims.ts`, `verify.ts` | `npm run knowledge:verify` | 83 claims, 154 quotes, all found on the stated page; negative tests prove the checker can fail | P0 |
| C: stored in database tables | PARTIAL | TS module + JSON report | — | Chosen for fresh-clone reliability; blueprint contracts are mirrored as TS types. Not queryable in SQL | P1 |
| C: review controls to correct a claim | DEFERRED | — | — | Today: edit the file and re-run the verifier | P2 |
| C: semantic entailment of claims | PARTIAL | `verify.ts` | — | Checks wording is on the page, not that the plain reading is fair. No lawyer review | P0 |
| **D** Grounded Q&A | WORKING | `lib/ask/`, `app/api/ask/route.ts` | Ask on a DPDP page | 25-question dev set 23/25 strict, 10-question held-out 8/10 strict, 6/6 indirect injections ignored | P0 |
| D: retrieval quality | PARTIAL | `lib/ask/retrieval.ts` | `npm run benchmark:holdout` | BM25 + synonyms; missed the erasure passage on a paraphrase (h01). No embeddings | P1 |
| D: cache and telemetry | PARTIAL | `answer.ts`, `lib/agents/audit-log.ts` | `data/logs/agent-executions.jsonl` | In-memory answer cache; the verification call's tokens are logged as null (only totals in results) | P2 |
| D: prepared answers without AI | WORKING | `dpdp.ts` `baselineAnswers` | Click a suggested question with no key | 9 answers, each with verified quotes, expiring by date | P0 |
| D: live model access | WORKING | `lib/env.ts` | `npm run benchmark:ask` | `gpt-6-luna` via Portkey works; missing key handled with a truthful message | P0 |
| **E** Stakeholder analysis | WORKING (DPDP) | `components/policy/StakeholderExplorer.tsx` | DPDP → Who is affected | 6 groups; each point typed (duty / right / fact / "our reading") with evidence; keyboard tested | P0 |
| E: other policies | DEFERRED | — | — | Provisional records have no stakeholder panel by design; no content is invented | P1 |
| **F** Economic Evidence Lab | PARTIAL | `app/evidence`, `components/economic/` | `/evidence` | Works and is honest (descriptive only). Gaps: chart has no y-axis tick labels; "Latest 36/60/120" offered with 16 points; not re-audited in depth this session. Not linked to any law, deliberately | P1 |
| **G** Media / public discourse | DEFERRED | — | — | Not built; stated as future work | P2 |
| **H** Following, alerts, Hindi | DEFERRED | `app/following` (hidden) | — | Not in navigation | P2 |
| **I** Safety and QA | WORKING | `tests/`, `scripts/injection-test.ts` | See README "Verify it" | 53 unit, 32 browser tests; 6 injection attacks; key absent from build and seed DB | P0 |
| I: internal QA dashboard | PARTIAL | `app/internal/qa` | `ANVAYA_QA_ENABLED=true` | Disabled in production by default; its checklist was not updated for this rebuild | P2 |
| **UX** Homepage, Explore, policy, research pages | WORKING | `app/`, `components/site`, `components/policy` | `npm run dev` | Desktop and 390px checked; no sideways scroll; fonts verified loaded | P0 |
| UX: user comprehension | UNVERIFIED | `docs/user-test-protocol.md` | Run the protocol | **No user study was run** | P0 |
| UX: accessibility | PARTIAL | — | — | Skip link, one h1 per page, tab keyboard support, reduced motion tested. No screen-reader pass; colour contrast not measured with a tool | P1 |
| **Runnable** fresh clone | WORKING | `scripts/setup.ts` | Copy to a clean folder, `npm ci && npm run setup && npm run build` | 23 s with warm npm cache on the dev machine; no-key mode verified | P0 |
| **Submission** `report.html`, `slides.html` | WORKING | `scripts/build-submission.ts` | Open in a browser; print | Report: 8 sections in order, 12 Letter pages, 10/10 images, offline. Slides: 10, reveal.js, keyboard nav, offline | P0 |
| Submission: repository on GitHub | DONE | https://github.com/alishahwark/anvaya | `gh repo view alishahwark/anvaya` | Dedicated public repository; fresh-clone run from the README tested | — |
| Submission: hosted demo, demo video | DEFERRED | — | — | Optional per the course page | P2 |

## Known defects and risks
- The model is non-deterministic: repeated benchmark runs differed by one or two questions. Reported numbers are from single runs.
- The development question set was used while building; the held-out set is the fairer figure.
- The checking model is the same family as the answering model, so errors can correlate.
- Dates: "eighteen months from publication" is shown as 13 May 2027; some commentators count a day later.
- Reports of a shortened timeline are from secondary sources and unconfirmed. The eGazette was not searched directly.
- Legacy UI components (`components/home/ParliamentStory.tsx`, `components/impact/`, old `components/policies/*`) and `app/impact`, `app/policies/page.tsx` redirects remain in the tree, unused. Nothing was deleted without permission.
- Four legacy Playwright specs were moved to `tests/legacy/` (they target the old UI and are excluded from runs).

## Needs your decision
1. **Model.** The course page says `gpt-6-luna` only; `AGENTS.md` says `gpt-5.6-luna`. The code defaults to `gpt-6-luna`; set `ANVAYA_MODEL=gpt-5.6-luna` to switch. Benchmarks for both are in `data/benchmarks/` (earlier model under `archive/`).
2. **Repository.** Published as a dedicated public repository (https://github.com/alishahwark/anvaya). If `REPO` changes, edit it in `scripts/build-submission.ts` and re-run.
3. **Name on the report.** Taken as "Alishahwar Kichloo" from the email and home folder. Correct it in `scripts/build-submission.ts` if wrong.
4. **User study.** Run `docs/user-test-protocol.md` with 3–5 people if time allows, then add the results to the report.

## Added 2026-10-25/26
| Item | Status | Notes |
|---|---|---|
| Design scorecard (4 scored dimensions, 90% ranges) | DONE | `lib/scoring/`, method in `docs/SCORING_METHODOLOGY.md`; phrase-pattern recall not measured |
| International benchmark pages | DONE (thin) | 18 UK/Canada comparators; most areas have fewer than 3, so no rank is shown |
| Evidence-of-effect ring | NOT AVAILABLE BY DESIGN | Estimators implemented and simulation-tested; blank until real outcome studies exist |
| Economic evidence lab | PREVIEW | Labelled as a future feature in the UI; descriptive MoSPI series only |
| UI redesign (menu, hero stage, motion) | DONE | Photos from Architectural Digest India are credited but not openly licensed |
| User study | NOT DONE | Protocol in `docs/user-test-protocol.md` |
