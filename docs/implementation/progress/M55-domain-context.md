# M55 — Domain context model v1

**Status:** Complete (2026-07-08)

## What was built

An optional, local, non-medical context model the user can attach to a set,
safe by construction and used in v1 for display/provenance only — it never
influences a finding, metric, confidence, or verdict.

- `web/src/domain/context.ts`:
  - `AssessmentContext` — schema-versioned, all-optional free-text fields:
    `goal`, `load`, `environment`, `note`, and `discomfortNote` (a personal
    note the app stores verbatim and never interprets). No pain score, injury
    history, medication, readiness, or any structured clinical field exists in
    the shape.
  - `parseAssessmentContext(raw)` — boundary validation that copies ONLY the
    known fields, so unknown/forbidden medical keys are dropped; trims, caps
    each field at 500 chars, returns null for non-objects or empty context.
  - `makeAssessmentContext`, `hasAnyContext`, `serializeAssessmentContext`.
  - Copy constants `ASSESSMENT_CONTEXT_DISCLAIMER` and `DISCOMFORT_NOTE_HELP`
    framing context as interpretive scope, not a medical assessment.
- `web/src/storage/sessionStore.ts` — `StoredSession.context?` added; schema
  bumped **v2 → v3** (optional field, backward compatible); v1/v2/v3 all
  readable; `buildStoredSession({ context })` attaches it only when supplied.
- `web/src/test/claimsCopyAudit.test.ts` — added `domain` to scanned
  `COPY_DIRECTORIES` so the new copy is inside the guardrail.

## Scope decision — no collection UI in v1

The roadmap gates the input UI as "add minimal local UI only if low-risk." A
free-text discomfort field carries claims risk and cannot be visually verified
this session (Art. V/XII), so v1 ships the safe MODEL + storage + serialization
only. The model is ready for a future capture/results form; nothing populates
`context` yet, which satisfies the acceptance criterion "context model exists
and is safe" without introducing an unverified user-facing surface.

## Verification (this session)

- `npm run build` clean (tsc + vite).
- `npm test` — 71 files, 469 tests passing (was 70/458; +11).
- New tests: build/trim/empty, serialize round-trip, boundary-drops forbidden
  medical fields, allowed-field-set has no clinical field, non-object → null,
  length cap, copy is claims-safe; storage attaches context without altering
  `result.findings` and omits it when absent.
- Updated `sessionArtifact.test.ts` version assertions (v2 → v3 current; v99
  unreadable) — these were legitimate expectations that advanced with the
  schema, not masked failures.

## Scope guards honored

- Discomfort note cannot trigger advice — it is never read by analysis.
- No finding changes from context in v1 (proven by test: findings identical
  with/without context).
- No medical recommendations generated from context.
