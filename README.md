# Anvaya (अन्वय)

**Understand the policies shaping India.** Anvaya is an independent, evidence-first policy research assistant. It finds official documents, explains them in plain language, and shows the exact passage behind every claim. It is a student project for Yale SOM MGT 409 and is **not** an official government service or legal advice.

Flagship: India's **Digital Personal Data Protection Act, 2023**, with its staged commencement (13 Nov 2025, 13 Nov 2026, 13 May 2027), Rules, corrigendum and October 2026 Removal of Difficulties Order. The register also holds 22 bills and Acts that Anvaya's verification engine checked against Parliament's record, India Code and the Gazette, each with a design scorecard compared with UK and Canadian statutes.

## Run it (about 5 minutes)

Requires Node.js 20+ and git (developed on Node 24).

```bash
git clone https://github.com/alishahwark/anvaya.git
cd anvaya
cp .env.example .env        # optional: add PORTKEY_API_KEY for live AI answers
npm install
npm run setup               # creates data/anvaya.db from the committed snapshot
npm run dev                 # http://127.0.0.1:3000
```

Production build instead of `npm run dev`: `npm run build && npm start`.

**Where `.env` is read:** Anvaya looks for `.env` in the repository folder first, then in the folder one level above it. Keys it reads, by these exact names: `PORTKEY_API_KEY` (course key, model `gpt-6-luna` only) and `OPENAI_API_KEY` (your own key, optional). Nothing else is needed.

**No key? Everything still works** except AI answers to new free-form questions, which say so plainly. The prepared questions on the DPDP page, all explanations, the verified register, the scorecard and benchmarks, the timeline, stakeholders and every official PDF link need no key.

**With a key:** try the question *"Do I need consent before emailing my customers about offers?"* on the DPDP page.

**Data:** the app ships with a small database snapshot (`data/seed/anvaya.seed.db`, public documents only) and the official PDFs it quotes (`data/source-inbox/`). `npm run setup` copies the snapshot to `data/anvaya.db`; delete that file and run setup again to reset. New bills you research are added to `data/anvaya.db` only.

## Things to try
0. Open the **Menu** (top right) to see every page. The **Economic evidence lab** is a labelled preview of a future feature.
1. Home → ask *"Are my customers' data rights already in force?"* → lands on the DPDP page with a prepared, quote-checked answer.
2. DPDP page → **Who is affected** → pick *Small businesses* → open *Evidence* → "Open the official PDF at page N".
3. Explore → type a bill or Act name, for example *Taxation and Other Laws Amendment Bill 2026* or *Telecommunications Bill 2023* → **Fetch and explain**. Anvaya searches Parliament's register and India Code, downloads every official version, runs the verification checks and opens the record. Ambiguous names offer the other matches. **No API key is needed for this part.**
4. On any policy page, find **How the policy is built**: hover a ring for the reason, click it for the comparison with UK and Canadian laws (`/methodology` explains the method).
5. On a record page: see the stage (for example "Enacted as Act No. 21 of 2026"), the legislative journey with a link to each official version, **How we verified this** (every check and its source), the plain-language analysis (needs a key the first time; saved afterwards) and the Ask box.
6. Paste a link to an official PDF (sansad.in, meity.gov.in, indiacode.gov.in, egazette.gov.in, pib.gov.in) into the same box to verify and explain that document.

## How it works
- `lib/knowledge/` — the **evidence-to-claim layer**. `dpdp-sources.ts` (six official PDFs), `dpdp-claims.ts` (83 claims, each with verbatim quotes and a page), `dpdp.ts` (plain-language content), `verify.ts` (checks every quote against the PDF text).
- `lib/ask/` — grounded Q&A: scoped retrieval (`retrieval.ts`), policy corpus (`corpus.ts`), answer + second-pass check (`answer.ts`).
- `lib/engine/` — the **verification engine**: `sansad.ts` (Parliament register client, ranking, stage), `indiacode.ts` (India Code client), `verify-bill.ts` (the checks), `resolve.ts` (search → fetch every version → verify → store), `store.ts` (true per-page text).
- `lib/scoring/` — the **scorecard**: phrase-pattern features, 17 bounded indicators, 90% ranges, benchmarks (`benchmarks/`), and gated effect estimators (`outcomes/`). `docs/SCORING_METHODOLOGY.md` has the method, references and validation.
- `lib/analysis/` — plain-language analysis of any retrieved document, checked statement by statement and cached.
- `lib/research/` — autonomous research: Sansad adapter, direct official-link intake, safe fetch (host allowlist, redirect checks), dedup, provisional records.
- `app/`, `components/` — Next.js 15 / React 19 UI. `app/anvaya.css` is the design system (Newsreader + Inter, loaded locally).
- `data/source-inbox/` official PDFs · `data/knowledge/` verification report · `data/benchmarks/` questions and raw results · `data/seed/` database snapshot (public documents only).

Legal status is computed from Gazette dates by code. An AI model never decides whether a law is in force.

## Verify it
```bash
npm run typecheck
npm test                      # 119 unit tests (evidence verifier, status, SSRF, retrieval hygiene, scorecard, estimators…)
npm run knowledge:verify      # checks all 154 quotes against the official PDFs
RUN_LIVE_AI=1 npm run test:e2e  # 38 browser tests (6 call the live model) on a production build (port 3110); omit RUN_LIVE_AI to skip live-AI tests
npm run benchmark:ask         # 25 questions against the live model (needs a key)
npm run benchmark:holdout     # 10 held-out questions
npx tsx scripts/injection-test.ts   # indirect prompt-injection attacks
npx tsx scripts/reverify-register.ts # re-fetch and re-verify every stored record against the live official sources
npx tsx scripts/seed-register.ts "Name one" "Name two"  # add laws to the register by running the engine on a name
npx tsx scripts/build-benchmarks.ts   # re-fetch and re-score the UK/Canada comparator statutes (network)
npx tsx scripts/score-register.ts     # print every register scorecard
npx tsx scripts/build-submission.ts # regenerates report.html and slides.html from the result files
```

## Deliverables
`report.html` (self-contained, printed on US Letter) · `slides.html` (reveal.js, 10 slides, self-contained) · `docs/IMPLEMENTATION_GAP_REGISTER.md` (what works, what is partial, what is not done) · `docs/user-test-protocol.md`.

## Configuration notes
- Model: `gpt-6-luna` through Portkey (the course-approved model) unless `ANVAYA_MODEL` is set. The course workspace's own `AGENTS.md` mentions `gpt-5.6-luna`; the course page says `gpt-6-luna` only, so that is the default here.
- Fetching is restricted to official hosts (Parliament, MeitY, India Code, eGazette, PIB) over HTTPS, with every redirect validated before it is requested.
- `/internal/qa` is disabled in production unless `ANVAYA_QA_ENABLED=true`.
- Never commit `.env`. `.gitignore` excludes `.env*` (except `.env.example`) and live databases.

## Attribution
Homepage photographs of the new Parliament building: Architectural Digest India (article linked in `public/assets/CREDITS.md`); they are credited on the page but are **not openly licensed**, and are included for this non-commercial course project. Other photos in `public/assets/` are from Wikimedia Commons (CC BY-SA 4.0) or the Press Information Bureau (GODL-India), all listed in `public/assets/CREDITS.md`. Fonts: Inter and Newsreader (SIL OFL). Slides: reveal.js 6.0.2 (MIT), loaded from a CDN with a bundled copy in `submission-assets/` as an offline fallback. Official documents © Government of India, reproduced for explanation with links to the originals.
