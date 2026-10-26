# Anvaya scorecard: methodology (version 1.0)

Code: `lib/scoring/`. Pages: `/policies/<slug>` (rings), `/policies/<slug>/benchmark`, `/methodology`.

## What it is, and is not
Four rings are composites of bounded indicators computed **from the official text** by fixed formulas. A fifth ring (evidence of effect) is gated and currently blank for every policy. Rings describe *design features* the research links to implementation. They do not judge a policy's goals or measure its outcomes, and there is no overall score. Colour is one hue (no red/green).

## Construction (OECD/JRC Handbook, 2008; Saisana, Saltelli & Tarantola 2005)
- Indicators scaled to [0,1]; point score = equal-weight mean × 100.
- Ratios with an empty or too-small denominator are *not measurable*, never zero.
- A dimension is scored only with ≥2 measurable indicators covering ≥50% of its indicators; else "insufficient evidence".
- Regime-level features need ≥20 binding sentences, which excludes most narrow amendments.
- 90% range: 800 replicates (300 above 20,000 sentences) that resample sentences with replacement and draw weights from Dirichlet(10,…,10) (about ±25–30% per weight); 5th–95th percentile, widened to include the point score. Seeded from the text, so exactly reproducible.
- Sensitivity: leave-one-indicator-out per dimension.

## Dimensions and sources
1. **Legal clarity**: settled-in-text share, deadlines, fixed commencement (Fuller 1964; Epstein & O'Halloran 1999).
2. **Enforceability**: enforcer, sanction size, response ladder, appeal, detection powers (Becker 1968; Polinsky & Shavell 2000; Ayres & Braithwaite 1992; OECD 2018).
3. **Proportionality**: tiering, reasonableness qualifiers, safeguards, exemptions (Barak 2012; OECD).
4. **Accountability & learning**: review/sunset, laying of rules, reporting, consultation, ex-ante assessment, committee scrutiny (OECD 2025; Hahn & Tetlock 2008).
5. **Evidence of effect**: gated. Needs outcome studies of tier ≤2 design (`data/outcomes/`, empty).

## Benchmarks
Comparators (UK legislation.gov.uk, Canada laws-lois) are fetched, title-checked, and scored by the same engine, with the two India-only indicators (ex-ante memoranda, committee referral) removed for everyone. Rank/percentile only with ≥3 comparators of ≥100 sentences; leave-one-out range of the median is shown. Amending bills and rules get none; areas with no verified comparator say so. Registry: `lib/scoring/benchmarks/registry.ts`; data: `data/benchmarks/comparators.json` (URL, SHA-256, fetch time).

## Effect estimators (`lib/scoring/outcomes/`)
Two-way fixed-effects DiD with CR1 cluster-robust errors (warns with <20 clusters and under staggered adoption); interrupted time series with Newey–West errors; synthetic control with simplex weights and placebo inference; DerSimonian–Laird meta-analysis; GRADE-style design tiers. **Validated on simulated data only** (`tests/outcomes.test.ts`: DiD bias <0.1 and ~95% coverage over 150 simulations; ITS coverage under AR(1) noise; synthetic control detects a large effect and not a null). Never run on real policy data.

## Validation done, and not done
- Unit tests of lexicon patterns, bounds, interval ordering, reproducibility, monotonicity, gating (`tests/scoring.test.ts`).
- Hand-read precision sample on the Telecommunications Bill (`scripts/validate-lexicon.ts`, 9 random flagged sentences per pattern): delegation 9/9, deadlines 4/4 (all flagged), sanction size 9/9. The reasonableness-qualifier pattern was only ~4/9 precise because it counted "unless/except" exceptions; those were removed. Not re-sampled afterwards, and **recall was not measured**. A single bill is a small sample.

## Limits
Phrase matching approximates meaning. Drafting conventions differ between India, the UK and Canada. UK texts are as enacted; Canadian texts are current consolidated. Ireland's statute book was tried and dropped (HTML returns fragments of long Acts). Comparator selection is a researcher's choice. Design features are proxies; their link to outcomes varies by context.
