# M54 — Accessibility and interaction audit

**Status:** Complete (2026-07-08)

## What was built

An accessibility audit of the capture/results/history/export flows, one
low-risk code fix, a durable test, and a documented manual-check list. No
visual redesign beyond the a11y fix (roadmap constraint).

- `docs/ux/ACCESSIBILITY_AUDIT.md` — status by area (keyboard nav, focus
  states, color-not-sole-signal, canvas text alternatives, reduced motion),
  automated coverage, and remaining human/browser checks.
- `web/src/index.css` — added a shared `:focus-visible` ring for
  `.results-tab`, `.hud-tool`, links, and form controls (previously only
  `.btn` had one; the app's dark surfaces made the browser default faint).
  Keyboard-only via `:focus-visible`; no layout impact (outline).
- `web/src/components/report/resultsTabsModel.test.ts` — asserts every report
  tab carries a non-empty accessible label.

## Audit findings (already passing, verified this session)

- **Keyboard reachability:** all audited controls are native
  button/link/input; report tabs use `role="tab"`/`aria-selected`.
- **Color redundancy:** confidence badge, readiness marks, and baseline chips
  all carry text alongside color — none is color-only.
- **Canvas text alternatives:** capture instructions live in the readiness
  checklist (`aria-live="polite"`), status card, and `role="alert"` notices —
  not only on the canvas; decorative canvases are `aria-hidden`.
- **Reduced motion:** a global `prefers-reduced-motion` block already
  near-zeroes animation/transition durations.
- No `outline: none` suppression exists in `index.css` (verified).

## Verification (this session)

- `npm run build` clean (tsc + vite — CSS compiled).
- `npm test` — 70 files, 458 tests passing (was 70/457; +1 tab-label test).

## Not verified this session (deferred to manual browser checks)

The audit doc lists the human checks that cannot be asserted from unit tests
(no `@testing-library` in the project): live focus-order and focus-ring
visibility, screen-reader announcement, contrast ratios, and reduced-motion
suppression of camera/replay motion. Arrow-key tab navigation
(roving-tabindex) is documented as a deferred enhancement — native buttons
already meet "keyboard reachable".
