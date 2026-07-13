# M88 — Tracking diagnostics and recovery guidance

**Status:** complete

Available protocols now own non-diagnostic recovery instructions for every M86
tracking state. The pure guidance selector emits at most one instruction using
this deterministic priority: out-of-frame, missing, low-confidence,
ambiguous-side, rejected, short-gap, recovered. Direct observations abstain.

The result also carries analyst-only evidence: sorted landmark indices, sorted
frame indices, and observation count. It does not infer anatomical error. M84's
completeness lint now rejects an available protocol that omits any recovery
state copy. Squat remains the only available protocol.

## Verification

- Guidance/completeness/claims: 3 files / 11 tests passed.
- Production build: 714 modules transformed.
- Cross-browser camera E2E: 20/20 passed across Chromium, Firefox, desktop
  WebKit, and iPhone WebKit.
- Existing abstention and camera behavior remain unchanged; the M87 recovery
  adapter remains outside the live pipeline.
