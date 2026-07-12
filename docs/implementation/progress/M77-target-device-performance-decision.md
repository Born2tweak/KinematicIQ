# M77 — Target-device performance decision

**Status:** Desktop/build evidence refreshed; physical iPhone decision pending
human execution (2026-07-12).

The current Vite 8 production build completes with 713 modules. Main JavaScript
is 515.83 kB / 159.85 kB gzip and the lazy 3D chunk is 893.62 kB / 238.25 kB
gzip, so the chunk warning remains. Automated browser checks exercise route and
fixture behavior in Chromium, Firefox, and WebKit, but headless timings are not
device budgets and do not measure a physical camera, MediaPipe readiness,
thermals, or battery.

The physical-iPhone script records model readiness, usable guidance latency,
preview stalls, a 10-minute thermal/battery sample, rotation, and export. Until
that row is executed, there is no evidence-based worker/chunk/3D optimization
decision. No performance refactor is authorized by the present measurements.
