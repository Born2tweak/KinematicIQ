# Forward-lunge perturbation catalog v1

`pose-perturbation-v1` is an evaluation-only, protocol-agnostic library. It applies ordered transformations to copied pose frames and records the seed, parameters, immutable source SHA-256, and output SHA-256. It never changes MediaPipe, the production pipeline, thresholds, filters, recovery, or protocol availability.

| Operation | Diagnostic purpose | Deterministic contract |
|---|---|---|
| `dropout` | Contiguous or periodic missing landmarks | Visibility becomes zero in the declared window/indices |
| `visibility` | Confidence degradation | Declared visibility replaces selected values |
| `coordinateJitter` | Landmark coordinate noise | Seeded bounded x/y/z offsets |
| `timestampJitter` | Cadence instability | Seeded offsets, monotonic by default; named negative cases may intentionally violate it |
| `duplicateFrames` / `removeFrames` | Repeated or absent observations | Declared indices only; duplicates use an intervening timestamp |
| `fpsResample` | Effective-FPS stress | Nearest samples on a declared uniform time grid |
| `occlusionMask` | Bounded crop/body overlap proxy | Landmarks within a normalized rectangle become unreadable |
| `identity` | Control and round-trip baseline | Frame values are exactly preserved |

Run `npm run eval:perturbations` from `web/`. The checked-in report is an engineering fixture, not evidence that synthetic stressors model population behavior. Changing the library contract requires a new version; prior manifests remain interpretable.

Passing these cases does not authorize live recovery, filter or threshold changes, human-validity claims, or availability.
