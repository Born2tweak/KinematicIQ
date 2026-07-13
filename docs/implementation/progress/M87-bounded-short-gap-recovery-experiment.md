# M87 — Bounded short-gap recovery experiment

**Status:** complete — candidate accepted as an isolated experiment; not enabled in live analysis

## Predeclared candidate and gates

The single candidate is `critical-landmark-linear-short-gap@1.0.0`: linear
interpolation for critical landmarks only, bounded to one or two consecutive
low-confidence frames and requiring direct observations at both endpoints.
The raw tape is never mutated. Acceptance required at least one recovered
landmark, fewer missing-critical frames, no additional implausible jumps,
rep-count parity on every tape, identical baseline/candidate bottom events, and
an unchanged camera suite.

## Result

The versioned 11-tape report accepted the experiment:

- 7 landmark samples recovered.
- Missing-critical frames improved from 624 to 620.
- Implausible-jump frames remained 12 to 12.
- Rep-count parity remained 11/11.
- Bottom-event output remained identical on 11/11 tapes.
- The production camera path was not changed; all 20 camera E2E cases passed.

Acceptance means the bounded adapter is supported by this corpus. It does not
silently enable synthesized landmarks in the live pipeline. Any later live
activation must explicitly preserve recovered-versus-direct provenance and run
the same gates again on the then-current corpus.

## Verification

- Focused experiment tests: 3/3 passed.
- Full unit suite: 85 files / 559 tests passed.
- Coverage: 86.88% statements, 81.61% branches, 92.26% functions, 88.16% lines.
- Production build: 714 modules transformed.
- Tape suite: 11 tapes, 0 errors; labeled rep count 9/9 exact.
- UI-PRMD reduced pilot: 90 trials/class, 2,527,200 paired samples.
- Camera E2E: 20/20 across Chromium, Firefox, desktop WebKit, and iPhone WebKit.

Evidence: `web/eval/benchmark-results/m87-short-gap-recovery-experiment-v1.json`.
