# Ghost.ai motion research

Audit date: 2026-10-25.

## Availability

`ghost.ai` and `ghost.ai/core` could not be resolved from this environment (`curl: Could not resolve host: ghost.ai`). I did not infer Ghost's framework, animation library, or implementation details. The observations below are therefore limited to the interaction principles specified in the brief, not claims about the live site.

## Adapted principles

| Principle | Anvaya adaptation | Accessibility/performance guardrail |
|---|---|---|
| Editorial pacing | Hero reveal and chapter-based policy narrative | Content is immediately present; reveal is disabled under reduced motion |
| Scroll-linked storytelling | DPDP lifecycle story maps viewport progress to six labeled stages | Native scrolling, requestAnimationFrame throttling, keyboard stage buttons |
| Pinned context | Sticky timeline narrative panel on desktop | Normal document flow on mobile; no scroll hijacking |
| Interactive nodes | SVG stakeholder network with selected analysis panel | Real buttons/tabs, touch-safe hit targets, live selected content |
| Evidence as visual material | Register ledger uses counts computed from local fixture records | Labels distinguish register counts from national outcomes |
| Calm transitions | CSS opacity/transform transitions and restrained hover states | No looping animation; reduced-motion media query |

## Existing Anvaya opportunities

The homepage was the highest-value target because it previously had dead CTAs and no narrative bridge between the product promise and the DPDP research page. The policy detail page benefits from sticky section navigation and an interactive commencement schedule, but remains information-first rather than theatrical.

## What remains unconfirmed

ScrollTrigger, WebGL, exact typography, exact easing, and Ghost-specific page architecture were not confirmed and were not copied. Anvaya uses native browser APIs and original SVG graphics instead.
