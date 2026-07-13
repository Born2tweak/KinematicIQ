# M84 — Protocol Completeness and Activation Lint

**Status:** complete
**Date:** 2026-07-12

## Implementation

- Added a pure completeness lint for available and planned protocols.
- Available protocols must declare a matching runtime, profile, outcome kind,
  capture contract, landmarks, active metrics, finding rules, confidence
  contributors, evidence references, a passed validation gate, and acceptance-
  threshold provenance.
- Planned protocols must remain metadata-only with no profile or input modes.
- Connected squat's existing executable metric and finding registries to its
  `ProtocolDefinition`; no metric, rule, threshold, or availability changed.

## Verification

- Targeted lint/registry/runtime/claims: 4 files / 27 tests passed.
- Production build passed; 714 modules transformed with the existing chunk
  advisory.
- Full unit suite: 82 files / 550 tests passed.
- `git diff --check` passed with line-ending conversion warnings only.
