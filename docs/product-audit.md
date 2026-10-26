# Anvaya product audit

Audit date: 2026-10-25. Baseline screenshots are in `docs/screenshots/before/`.

## Findings before repair

| Area | Finding | Severity | Evidence |
|---|---|---:|---|
| Homepage navigation | “Explore policy” and “Browse the brief” rendered as buttons without handlers or links. | High | `app/page.tsx` |
| Homepage content | Brief copy said the verified DPDP record was unverified, contradicting the imported database evidence. | High | `app/page.tsx` |
| Explore | Search filtered local records, but result cards had no links; status/topic filters were absent. | High | `components/policies/PolicySearch.tsx` |
| Policy detail | Timeline events showed text only; source documents were not reachable from individual milestones. | High | `app/policies/[slug]/page.tsx` |
| Ask Anvaya | API citations were returned but not rendered; errors were presented as ordinary answer text. | High | `components/chat/InterpretationForm.tsx` |
| Impact | `/impact` was a static placeholder and did not lead to the working impact explorer. | High | `app/impact/page.tsx` |
| Analysis activity | Activity text implied a fixed sequence even while only one selected agent executed. | Medium | `components/agents/AnalysisActivity.tsx` |
| Following | Page accurately states that alerts are not implemented, but had no useful next action. | Medium | `app/following/page.tsx` |
| Responsive design | Base styles were minimal; mobile behavior had not been covered by Playwright. | Medium | `app/globals.css`, existing tests |
| QA visibility | No persistent checklist, run history, manual verification workflow, or export existed. | High | No `/internal/qa` route existed |

## Browser audit coverage

Baseline captures were attempted for desktop home, explore, and DPDP routes. Chromium capture succeeded. The configured mobile device requiring WebKit was blocked because the WebKit browser binary is not installed; mobile verification is therefore recorded as blocked until Chromium mobile emulation is used or WebKit is installed.

The baseline implementation had no reliable automated click coverage for search, policy navigation, source links, impact analysis, or Ask Anvaya. These are now covered by the repaired Playwright suite and the internal QA dashboard.

## Root causes

1. Pages were built independently rather than around a shared navigation and interaction contract.
2. Several visual controls used the `Button` component without an `href`, `onClick`, or form role.
3. The local fixture was treated as display data, so evidence metadata was not carried into all UI surfaces.
4. The existing tests checked only the homepage text and did not exercise user journeys.

## Repair policy

The repair keeps the verified DPDP fixtures, deterministic status engine, importer, and AI API intact. New UI behavior is backed by ordinary links, validated client requests, and fixed QA commands. The QA runner never accepts shell commands from the browser.
