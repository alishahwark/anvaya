# Economic Evidence Lab QA

## Automated

- TypeScript: passed.
- Unit tests: passed, 20 tests total, including deterministic statistics and scenario calculations.
- Source import: passed for MoSPI CPI; 64 normalized observations stored in current vintage 2.
- Provenance: passed; raw payload, retrieval timestamp, processing steps, and SHA-256 are retained.
- Duplicate protection: passed; rerunning the same source checksum reuses its vintage.
- Base-year validation: passed; mixed returned base years are excluded from the 2019 dataset.
- Unsupported-source handling: passed; NPCI 403 and RBI endpoint limitations remain unavailable states.

## Browser verification

Chromium smoke tests were run against `http://localhost:3001/evidence` (the existing port 3000 process was already occupied): page load, metric selection, range selection, scenario input update, desktop screenshot, mobile screenshot, console-error check, and horizontal-overflow check. Desktop and mobile had no console errors; mobile document width matched the 390px viewport after the responsive fix.

Screenshots:

- `docs/screenshots/economic-evidence-lab-desktop-final.png`
- `docs/screenshots/economic-evidence-lab-mobile-final.png`

The remaining verification gap is a full production-server run and the existing Playwright suite after the Evidence Lab route is included in the suite.
