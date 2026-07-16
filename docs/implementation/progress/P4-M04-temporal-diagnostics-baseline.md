# P4-M04 temporal diagnostics baseline

Status: immutable engineering baseline generated; CV/validation-owner classification remains a human gate.

The v1 report identifies each source checksum, transformation, perturbation version, raw stream, and One-Euro candidate separately. It includes sequence/frame/landmark denominators; timestamp and effective-FPS integrity; per-landmark readable/dropout runs and velocity/acceleration extrema; side-order flips; phase persistence and phase missingness; raw-to-filter coordinate lag; filter and perturbation count/event sensitivity; distribution summaries; and all ranked worst cases.

Current-session verification on 2026-07-16:

- Targeted temporal and existing tracking tests: 6/6 passed.
- `npm run build`: passed; 720 modules transformed (existing chunk-size warning remains).
- `npm run eval:lunge-diagnostics`: generated 4 sequence rows / 207 frames.
- Observed diagnostic, not a threshold decision: the 15 FPS synthetic resample produced zero complete trials versus two in identity; bottom-only dropout produced 30 missing landmark-frame observations; raw/One-Euro bottom events differed by one frame in paired completed trials.

These are synthetic engineering findings. They do not select a filter, threshold, recovery policy, data qualification rule, event construct, or product behavior.
