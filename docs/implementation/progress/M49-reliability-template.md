# M49 - Reliability Study Template And Offline Calculator

**Date:** 2026-07-07
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What changed

Added `web/src/eval/reliability.ts`, a pure offline helper module for future
validation studies. It accepts metric measurements grouped by participant,
session, and metric id, excludes missing values deterministically, and returns
descriptive reliability summaries:

- mean;
- sample standard deviation;
- SEM-like estimate;
- MDC95-like estimate;
- mean absolute repeat difference across repeated participant sessions.

Added `web/src/eval/reliability.test.ts` with small known datasets, missing
value handling, insufficient-data null behavior, and stable multi-metric
summary ordering.

Added `docs/validation/RELIABILITY_STUDY_TEMPLATE.md`, which defines the
minimum repeated-session dataset shape, how outputs feed the M48 metric status
board, and forbidden uses. The template is explicit that these helpers are not
ICC and do not upgrade product claims by themselves.

Updated `web/src/session/changeDetection.ts` to point the M32 heuristic
threshold replacement path at the new reliability helper and template.

## Verification

- Targeted Vitest: `npm test -- reliability` passed 1 file / 6 tests.
- Full milestone gates still required before commit:
  `npm run build`
  `npm test`
  `npm run test:coverage`

## Not done

No reliability values are displayed to users. No metric tier was upgraded. No
ICC calculator was added because the current local data shape does not support
a formal model choice.
