# P4-M05 independent event-labeling tool

Status: engineering tool complete; non-developer usability, Windows/browser accessibility, and validation-owner blinding reviews remain required human gates.

Delivered a local-only, keyboard-operated CLI and `forward-lunge-event-labels-v1` contract for the eight frozen ontology events. It provides exact constant/variable-FPS frame/time mapping, explicit null reasons, checksum and identity validation, ordered events, blinded-file rejection, atomic draft/recovery saves, immutable freeze, post-freeze comparison, third-record adjudication, parent hashes, and audit history. It contains no automated prelabels or KinematicIQ/FMS outputs.

Current-session verification on 2026-07-16:

- `npm test -- --run src/eval/eventLabels.test.ts`: 3/3 tests passed.
- `npm run build`: passed; 720 modules transformed (existing chunk-size warning remains).
- CLI fixture exercise: local media hashing, draft initialization, keyboard `set` operations, and atomic recovery handoff executed. The full freeze/compare/adjudication lifecycle is pinned by the unit test.

The required two non-developer dry runs and owner reviews cannot be performed or signed by an autonomous coding agent. No study media, rater qualification, protocol validation, or availability is authorized.
