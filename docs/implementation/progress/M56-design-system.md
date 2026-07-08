# M56 — Design system extraction v1

**Status:** Complete (2026-07-08)

## What was built

A v1 design-system reference plus one restrained extraction — no redesign.

- `docs/ux/DESIGN_SYSTEM.md` — token reference (semantic color, confidence
  state, spacing, radius, typography, focus, motion), primitive inventory
  (`Button`, `Card`, `ConfidenceBadge`, `ResultsTabs`, `FindingCard`), rules
  for new UI, and known follow-ups.
- `web/src/components/ui/confidenceState.ts` — `confidenceBadgeClass(level)` /
  `confidenceLabel(level)`: the single source for the confidence chip's class
  and text. Pure, DOM-free.
- `web/src/components/ConfidenceBadge.tsx` — now consumes the primitive; inline
  hex removed.
- `web/src/index.css` — added `--confidence-high/medium/low` (+ `*-bg`) tokens
  and `.confidence-badge--{high,medium,low}` classes. Token values match the
  previous inline styles exactly, so there is **no visual change**.
- `web/src/components/ui/confidenceState.test.ts` — class/label mapping.

## Why this scope

The project has a mature token system in `:root` already. The one genuine
duplication was the confidence chip's colors, hardcoded inline in
`ConfidenceBadge` (rendered in ≥2 places: findings, coach questions, camera
panel). Extracting it to tokens + a pure helper is the canonical design-system
move at lowest risk. The confidence progress-bar gradient
(`.confidence__fill--*`) was left untouched to avoid a visual change and is
recorded as a follow-up.

## Verification (this session)

- `npm run build` clean (tsc + vite).
- `npm test` — 72 files, 472 tests passing (was 71/469; +3).
- **Browser (preview server):** injected `.confidence-badge--high` computes to
  `rgb(34,197,94)` on `rgba(34,197,94,0.15)`, and `--confidence-high` resolves
  to `#22c55e` — byte-identical to the pre-M56 inline colors. The extraction is
  visually lossless.

## Scope guards honored

- No landing-page redesign, no nested card-heavy UI.
- Visual output unchanged (verified in browser).
- No `@testing-library` added — primitive covered by a pure logic test, in the
  project's established testing style.
