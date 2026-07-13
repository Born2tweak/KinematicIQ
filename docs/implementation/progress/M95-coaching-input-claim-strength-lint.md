# M95 — Coaching input and claim-strength lint

**Status:** complete

The traceability lint rejects coaching rules without a measurable traced input
and suggestion-strength copy sourced from experimental metrics. Existing claims
audit and `summaryFindings(..., 3)` preserve forbidden-term and maximum-three-cue
boundaries. Malformed fixtures fail in targeted tests.
