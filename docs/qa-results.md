# Anvaya QA results

Last execution: 2026-10-25. The persisted results are available at `/internal/qa` and in the `qa_runs` / `qa_checks` SQLite tables.

## Automated execution

- `npm run typecheck`: PASS
- `npm test`: PASS — 14 tests
- `npm run test:e2e`: PASS — 6 browser tests
- `npm run build`: PASS
- Database migration: PASS
- Source evidence inventory: PASS — 3 imported PDFs, 64 excerpts, 3 verified source documents

The browser QA run recorded 19 PASS, 1 BLOCKED, and 96 NOT_TESTED checks out of 116. The blocked item is production build execution from inside a live `next dev` process; running a build in that state would mutate the shared `.next` directory and interrupt the app. The build was run separately and passed.

## Browser journeys verified

1. Homepage discovery CTA → Explore register.
2. Search query → DPDP result → policy detail.
3. Timeline → page-linked official source.
4. Impact route → working stakeholder analysis control.
5. Mobile viewport → no horizontal overflow on home, explore, DPDP, and impact routes.
6. Internal QA route → persistent checklist and export control.
7. Scroll-linked legislative stage selection, stakeholder tab selection, and reduced-motion direct controls.
8. Cinematic screenshot capture at seven desktop scroll positions and two mobile positions.

## Manual verification policy

The remaining checks are deliberately `NOT_TESTED`, not assumed to pass. A reviewer can expand a manual item in `/internal/qa`, choose PASS, FAIL, or BLOCKED, and enter notes/evidence. The dashboard persists the reviewer and timestamp. No manual check is promoted automatically from a build result.

## Evidence captures

- Baseline: `docs/screenshots/before/`
- Repaired desktop/tablet/mobile: `docs/screenshots/after/`
- QA dashboard: `docs/screenshots/after/qa-dashboard-final.png`

The configured WebKit mobile screenshot was blocked because the local WebKit browser binary is not installed. Chromium mobile emulation and Playwright mobile overflow assertions passed.
