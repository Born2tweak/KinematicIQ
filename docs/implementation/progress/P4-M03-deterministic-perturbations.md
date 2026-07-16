# P4-M03 deterministic perturbations

Status: engineering implementation complete; required CV-owner sign-off remains a human gate.

Delivered `pose-perturbation-v1`, an immutable seeded transform API, typed/checksummed manifests, forward-lunge matrix runner, checked-in benchmark artifact, tests, and catalog. Automated checks cover determinism, different-seed behavior, identity, source immutability, composition, strict timestamp validation, FPS resampling, malformed windows, and both lead-side fixtures.

Current-session verification on 2026-07-16:

- `npm test -- --run src/eval/perturbations/perturbations.test.ts`: 3/3 tests passed.
- `npm run build`: passed; 720 modules transformed (existing chunk-size warning remains).
- `npm run eval:perturbations`: wrote the v1 matrix report.

No production path imports the library. Synthetic robustness is diagnostic engineering evidence only.
