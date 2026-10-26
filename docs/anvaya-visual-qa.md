# Anvaya visual QA

The final visual QA uses Playwright at 1440×900, 768×1024, and 390×844. Verified browser assertions cover homepage discovery, policy search, DPDP timeline/source links, Impact Explorer presence, mobile horizontal-overflow absence, and the internal QA page.

Screenshots are stored in `docs/screenshots/before/` and `docs/screenshots/after/`. Reduced-motion CSS is implemented and the timeline falls back to direct stage selection. WebKit-specific capture is blocked until the local WebKit browser binary is installed; Chromium mobile emulation passed.

Performance targets (LCP ≤ 2.5s and CLS ≤ 0.1) are targets, not measurements. No performance claim is made without a browser trace.
