# Motion implementation

The homepage uses native scrolling. The legislative story maps the story element's viewport travel to six stages, throttled through `requestAnimationFrame`; teardown removes the scroll listener and cancels a pending frame. Clicking a stage updates the same state and scrolls that step into view. `prefers-reduced-motion` disables scroll-scrub behavior while preserving direct stage buttons.

The stakeholder network uses CSS transitions for selected node emphasis and React state for panel replacement. SVG lines are rendered before the central circle/text so they cannot cross the policy label. On mobile the radial SVG is replaced by a compact accessible tab grid.

The implementation was browser-tested in both normal and reduced-motion modes. It does not use scroll hijacking or persistent looping animations.
