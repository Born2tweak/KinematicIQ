# M67 — Camera and session responsive experience

**Status:** Complete (2026-07-11).

The camera HUD, navigation, action targets, readiness disclosure, and safe-area
spacing now adapt to phone and tablet viewports. The setup checklist is collapsed
by default so the live task remains primary.

Evidence: the camera Playwright suite covers desktop, 390 px mobile, and tablet
views. An in-app browser inspection at 390 × 844 measured no horizontal overflow
and kept the History navigation item inside the viewport.
