# Anvaya UI design system

Anvaya uses an editorial civic-research visual language: ivory surfaces, navy ink, teal actions, and saffron verification accents. Serif headings create a publication feel; sans-serif labels and controls improve scanability.

## Tokens

- Paper: `#FAF8F3`
- Navy: `#102E3C`
- Teal: `#267C76`
- Saffron: `#D38B45`
- Muted ink: `#60716C`
- Rule: `#D8DED5`

## Interaction rules

- Every primary action is a link, submit button, or button with a visible handler.
- Verified evidence uses a restrained teal/green treatment; AI analysis is always labeled separately.
- Unknown and unverified states are explicit and never rendered as successful progress.
- Focus rings use the navy token and remain visible for keyboard users.
- Cards collapse to one column below the tablet breakpoint.
- Motion is limited to hover/focus feedback and respects `prefers-reduced-motion`.

## Content rules

Use plain-language headings, show the legal status before interpretation, attach source metadata to consequential claims, and state when evidence is unavailable. Avoid progress percentages for legislative status.
