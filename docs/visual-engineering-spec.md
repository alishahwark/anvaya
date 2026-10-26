# Visual engineering specification

## Typography

Editorial headings use the `Newsreader` token with a Georgia fallback; interface and metadata use the `Inter` token with an Arial fallback; multilingual content can use `Noto Sans Devanagari`. Display sizing is fluid and body copy is kept within readable measure.

The environment did not provide local Newsreader/Inter font binaries and external font DNS was unavailable, so this build records the intended family tokens and deterministic fallbacks rather than claiming that remote webfont assets loaded.

## Motion ownership

- CSS owns hero entrance and reduced-motion suppression.
- `AnimatedLegislativeTimeline` owns scroll progress, stage state, and cleanup with `requestAnimationFrame`.
- `StakeholderNetwork` owns selection state and SVG emphasis.
- No GSAP, Motion, or competing animation library is installed.

## Visual data contract

The evidence ledger is computed from `legislativeRecords`, not invented statistics. The stakeholder network displays qualitative, source-bounded analysis. No chart presents unsupported economic, media, or causal outcomes.
