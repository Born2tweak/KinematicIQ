# KinematicIQ Design System v1 (M56)

The shared UI vocabulary for the app. New protocol screens **reuse** these
primitives and tokens rather than forking styles. This is a v1 inventory +
token reference, not a redesign — the app's visual language is unchanged.

Source: `docs/research/11_Product_Experience_Bible.md` (design system, dense
operational UI). Tokens and classes live in `web/src/index.css`; primitives in
`web/src/components/`.

## 1. Design tokens (`:root` in `index.css`)

### Color — semantic
| Token | Use |
|---|---|
| `--color-bg`, `--color-bg-elevated` | Page and raised surfaces |
| `--color-surface`, `--color-surface-elevated` | Glass panels |
| `--color-border`, `--color-border-strong` | Hairlines, emphasized edges |
| `--color-accent`, `--color-accent-hover`, `--color-accent-muted` | Primary action / focus |
| `--color-text`, `--color-text-muted` | Body and secondary text |
| `--color-success` | Positive/confirmation |

### Color — confidence state (M56)
The canonical confidence-chip colors, shared by every confidence surface:
`--confidence-high` (#22c55e), `--confidence-medium` (#facc15),
`--confidence-low` (#ef4444), each with a matching translucent `*-bg`.
**Always paired with a text label** ("High/Medium/Low confidence") — color is
never the sole signal (WCAG, M54).

### Spacing
`--space-xs` 0.25rem · `--space-sm` 0.5rem · `--space-md` 1rem ·
`--space-lg` 1.5rem · `--space-xl` 2rem · `--space-2xl` 3rem. Use these; do not
hardcode paddings/margins.

### Radius
`--radius-sm` · `--radius-md` · `--radius-lg` · `--radius-full`.

### Typography
Body: Inter, 1rem / line-height 1.6. Titles use `.page-title`,
`.results-section-title`, `.results-panel__heading`, `.card__title`.

### Focus (M54)
Every interactive element gets a `:focus-visible` ring —
`outline: 2px solid var(--color-accent)`, `outline-offset: 2px`. Covered:
`.btn`, `.results-tab`, `.hud-tool`, links, and form controls. Never
`outline: none` without a replacement ring.

### Motion
`--transition-fast` 150ms · `--transition-base` 250ms. A global
`prefers-reduced-motion: reduce` block near-zeroes animation/transition
durations.

## 2. Primitives (`web/src/components/`)

| Primitive | Variants / API | Notes |
|---|---|---|
| `Button` | `primary` \| `secondary` \| `ghost`; `to` (renders `<Link>`); `block` | Native `<button>`/`<Link>`, keyboard-operable, focus ring built in |
| `Card` | `default` \| `status`; `title`, `subtitle` | Container with optional header |
| `ConfidenceBadge` | `level` | Class-based via `ui/confidenceState.ts` — no inline color |
| `ResultsTabs` | `role="tablist"` / `role="tab"` | Progressive disclosure: Summary / Evidence / Expert |
| `FindingCard` | `showProvenance` (M50), `showConstraint` (M52) | Opt-in Evidence/Expert extras; Summary stays clean |

### Extracted this milestone
- `components/ui/confidenceState.ts` — `confidenceBadgeClass(level)` and
  `confidenceLabel(level)`: the single source for confidence-chip class + text.
  `ConfidenceBadge` now consumes it; colors moved from inline hex to
  `--confidence-*` tokens (identical values, no visual change).

## 3. Rules for new UI
1. **Reuse before forking** — extend an existing primitive or token; do not
   duplicate a style already defined here.
2. **Extract only at 2+ uses** — a pattern earns a shared class/component once
   it appears in at least two places.
3. **Every state** — provide disabled, loading, empty, and focus states, not
   just the happy path.
4. **Restraint** — no landing-page redesign, no deeply nested card-in-card UI.
5. **Color + text** — status/confidence must carry a text label, never color
   alone.

## 4. Known follow-ups (not done in v1)
- The confidence **progress-bar** fill (`.confidence__fill--*`) uses its own
  gradient set, distinct from the chip tokens. Left as-is to avoid a visual
  change; a future pass could reconcile it to `--confidence-*`.
- No `@testing-library` in the project, so primitives are covered by pure
  logic tests (e.g. `confidenceState.test.ts`), not DOM render tests.
