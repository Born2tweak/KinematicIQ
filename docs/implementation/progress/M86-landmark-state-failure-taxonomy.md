# M86 — Landmark State and Failure Taxonomy

**Status:** complete
**Date:** 2026-07-12

Added an additive observation contract for observed, low-confidence, short-gap,
recovered, missing, out-of-frame, ambiguous-side, and rejected landmarks. Raw
tracker output is retained; short gaps never invent coordinates. Metric
eligibility distinguishes direct from recovered evidence. No existing pipeline
or user claim consumes this contract yet.

- Targeted CV tests: 3/3 passed; production build passed.
- Coverage: 86.70% statements, 81.74% branches, 92.17% functions, 87.89% lines.
- M85 baseline regenerated unchanged at 11/11 rep parity.
- `git diff --check` passed with line-ending warnings only.
