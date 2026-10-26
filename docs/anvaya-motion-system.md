# Anvaya motion system

## Implemented primitives

- `AnimatedLegislativeTimeline`: client-side scroll progress, sticky desktop narrative, accessible stage buttons, cleanup of scroll listeners and animation frames.
- `StakeholderNetwork`: original SVG node-and-connector visualization with keyboard/touch selection and live panel updates.
- `CommencementSchedule`: keyboard-selectable Act/Rules groups with table fallback.
- CSS hero reveal: one-time transform/opacity entrance, removed under reduced motion.

The implementation intentionally avoids an additional motion dependency. Native `requestAnimationFrame`, CSS transitions, SVG, and `prefers-reduced-motion` provide the required behavior with less bundle and lifecycle risk.

## Motion rules

Hover: 120–180ms. Panel/state transitions: 180–320ms. Story progress follows actual scroll position. Legal records never change from animation state.

## Fallbacks

Reduced-motion users receive static content with stage buttons. Mobile users receive a sequential vertical timeline and no forced pinned narrative. Every core fact is rendered as text and remains available without movement.
