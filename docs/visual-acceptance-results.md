# Visual acceptance results

## Browser results

- 9 Playwright tests passed, including scroll story, stakeholder selection, reduced motion, source links, mobile overflow, and screenshot capture.
- 14 unit tests passed.
- TypeScript and production build passed.
- Browser console and failed-request audit for the homepage reported no errors or failed requests at the inspected viewports.
- Stakeholder screenshots were captured for all four selected states.

## Captures

`docs/screenshots/visual-rebuild/` contains the four stakeholder states. `docs/screenshots/cinematic/` contains seven desktop scroll positions and two mobile positions.

## Remaining visual limitations

- Newsreader/Inter/Noto Sans Devanagari binaries are not locally available in this restricted environment; deterministic CSS fallbacks are used.
- WebKit capture remains unavailable because the local WebKit browser binary is not installed.
- LCP, CLS, and CPU measurements were not collected, so performance targets remain targets rather than claims.
