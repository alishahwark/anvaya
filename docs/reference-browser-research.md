# Reference browser research

Research date: 25 October 2026. The reference pages were opened in Chromium at 1440 × 900, scrolled to an intermediate position, and the first link was hovered. Screenshots are stored in `docs/reference-browser/`.

## Confirmed observations

- **America.gov:** The experience uses generous white space, large high-contrast sans-serif headlines, short explanatory blocks, and explicit source-oriented calls to action. Content is arranged as alternating visual/text compositions rather than a dense dashboard.
- **Apple:** The page has a persistent, restrained navigation bar and very long editorial/legal content. This demonstrates the importance of readable line length and strong typographic hierarchy when a page contains source detail; dense legal copy needs its own reading rhythm.
- **Ghost.ai:** The inspected mid-page scene uses a dark, atmospheric visual field with pinned-looking contextual copy and restrained labels. The visual effect is cinematic, but the product message remains short and legible. The screenshot shows the intended mood, not a claim about the underlying framework.
- **Linear:** The dark interface uses precise alignment, low-contrast dividers, sparse navigation, and large section transitions. Feature groups are presented as editorial chapters instead of repeated dashboard cards.
- **Motion.dev:** The page makes performance and composability explicit through compact feature columns, a dark high-contrast surface, and interactive visual examples. This supports Anvaya's choice to keep motion lightweight and purposeful.
- **U.S. Web Design System:** The page foregrounds a persistent utility navigation, strong link affordances, and example-based component guidance. This supports clear focus states, accessible controls, and source links that look like links rather than decorative labels.

## Adaptation for Anvaya

Anvaya adopts the useful principles—editorial pacing, generous composition, strong navigation, and progressive disclosure—while retaining its ivory/navy/teal/saffron civic palette. Legislative stages, evidence excerpts, and stakeholder explanations remain directly accessible and are never hidden behind a scroll effect. Motion is limited to transitions and state emphasis; legal status comes only from the deterministic evidence-backed engine.

## Accessibility and performance notes

Scroll-linked composition must have a normal-flow mobile fallback, keyboard-selectable milestones, and a reduced-motion mode. Source links remain visible without completing an animation. The local app uses lightweight CSS/SVG motion and avoids a mandatory scroll hijack or WebGL dependency.

## Browser evidence

Local access was verified against `http://127.0.0.1:3000`: the home page returned successfully, Chromium loaded the local fonts, no console errors were observed during the smoke interaction, and the search input accepted a real query. The resulting screenshot is `docs/reference-browser/anvaya-access-home.png`.
