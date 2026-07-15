# ADR-015: Squat-Only Availability Continues

**Status:** Accepted and binding.

## Decision

Squat remains the only available protocol. Forward Lunge stays planned, experimental, unavailable, and excluded from live/upload/session/results/coaching flows until a separate activation decision after scientific gates close. `web/src/protocols/inlineLunge/inlineLunge.test.ts` pins the current fail-closed invariant.
