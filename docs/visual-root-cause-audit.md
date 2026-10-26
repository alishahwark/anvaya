# Visual root-cause audit

Audit date: 2026-10-25. Browser inspection was performed against the running application at 1920×1080, 1440×900, 1024×768, 768×1024, 390×844, and 360×800.

## Confirmed causes

1. The rendered body used `Georgia`/Arial stacks directly; there were no semantic font tokens or local font loading strategy. Computed styles confirmed browser fallback typography.
2. The stakeholder SVG painted connector lines after the central node and its labels, so horizontal connectors visibly crossed `DPDP Act` text. Outer connector endpoints were tied to arbitrary label centers.
3. The stakeholder panel was a fixed, oversized rounded rectangle with repeated generic labels and little content hierarchy.
4. The mobile layout retained the desktop radial network instead of switching interaction models.
5. Scroll state had a single native listener but no explicit reduced-motion state in the visual component architecture; direct stage controls were not the primary mobile path.
6. Several visuals were not source-aware: the evidence ledger and public discourse surface had no clear distinction between verified local counts and unavailable broader datasets.

## Verified corrections

- Added semantic editorial/UI/Devanagari font tokens and typography hierarchy.
- Rebuilt the network as structured SVG geometry with connectors drawn behind the central node and explicit node-edge endpoints.
- Replaced mobile radial layout with a two-column touch selector.
- Reduced the analysis panel and separated record facts, potential implications, and evidence boundaries.
- Added direct stage selection, reduced-motion fallback, cleanup for scroll listeners/frames, and browser tests.
- Replaced unsupported discourse/statistics with explicit unavailable states and computed local-register evidence counts.
