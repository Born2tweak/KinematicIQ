# Accessibility & Interaction Audit (M54)

Scope: capture (CameraScreen), results (ResultsScreen + report tabs), history,
and export flows. This is a v1 audit — code fixes landed where low-risk;
remaining items are manual browser checks listed at the end. The app is not
redesigned beyond accessibility fixes (roadmap constraint).

Standard referenced: WCAG 2.1 AA, per `docs/research/11_Product_Experience_Bible.md`.

## Status by area

### 1. Keyboard navigation — PASS (with one enhancement deferred)
- All controls are native `<button>`/`<a>`/`<input>` elements, so Tab reaches
  them and Enter/Space activate them. No `div`-with-onClick traps found in the
  audited screens.
- Report tabs (`ResultsTabs`) use `role="tablist"` / `role="tab"` /
  `aria-selected` and are native buttons — keyboard reachable and operable.
- **Deferred (documented, not a blocker):** roving-tabindex + arrow-key
  movement between tabs (full WAI-ARIA tabs pattern). Current native buttons
  already satisfy "keyboard reachable"; arrow-key nav is an enhancement.

### 2. Focus states — FIXED
- Previously only `.btn` had a `:focus-visible` ring; other custom-styled
  interactive elements (`.results-tab`, `.hud-tool`) relied on the browser
  default, which is faint on the app's dark surfaces.
- Added a shared `:focus-visible` ring (`index.css`, "Accessibility (M54)"
  block) for tabs, HUD tools, links, and form controls, matching the `.btn`
  accent ring. `:focus-visible` keeps it keyboard-only (no mouse-click ring).
- No `outline: none` suppression exists anywhere in `index.css` (verified).

### 3. Color is not the only signal — PASS
- `ConfidenceBadge` renders the text "High/Medium/Low confidence" — color is
  redundant, not the sole carrier.
- Capture-readiness checklist items pair an `aria-hidden` mark (✓ / ! / ○)
  with a text label, plus `aria-live="polite"` for state changes.
- Baseline change chips render text ("within noise" / "possible change" /
  "not judged") alongside their color.

### 4. Text alternatives for canvas guidance — PASS
- The live skeleton/vignette canvases are decorative (`aria-hidden` vignette;
  the skeleton overlay is a visual aid, not the instruction source).
- Capture instructions exist as **text**: the readiness checklist, the
  `SessionStatusCard` title/subtitle, and `role="alert"` error/loading notices
  — not only drawn on the canvas.

### 5. Reduced motion — PASS
- A global `@media (prefers-reduced-motion: reduce)` block near-zeroes
  animation and transition durations for all elements.

## Automated coverage added
- `resultsTabsModel.test.ts` — asserts every tab carries a non-empty
  accessible label (guards against an unlabeled tab control).
- Full DOM/screen-reader assertions are not automated: the project has `jsdom`
  but no `@testing-library`, so render-level a11y tests are out of scope for
  this milestone.

## Remaining manual checks (browser, human)
Run these in a real browser; they cannot be asserted from unit tests here:
1. Tab through each route end-to-end; confirm focus order is logical and the
   new focus ring is visible on every control against dark and light surfaces.
2. Screen-reader pass (NVDA/VoiceOver) over capture → results → export: confirm
   the readiness checklist and confidence badges are announced.
3. Verify color-contrast ratios of the confidence chip text colors
   (#22c55e / #facc15 / #ef4444) meet AA against their translucent backgrounds.
4. Confirm `prefers-reduced-motion` actually suppresses the camera HUD and
   replay motion in the browser.
5. Keyboard-operate the report tabs and the Expert-tab CSV export button.
