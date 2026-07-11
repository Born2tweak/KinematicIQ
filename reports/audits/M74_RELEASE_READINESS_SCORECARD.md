# M74 Release-Readiness Scorecard

**Run date:** 2026-07-11  
**Decision:** **Not release-ready**; local engineering gates pass, but manual
assistive-technology evidence, an authorized production URL/header check, and the
breaking dev-toolchain remediation decision remain open.

| Gate | Result | Current-session evidence |
|---|---|---|
| Production build | Pass | 752 modules; build completed in 6.38 s |
| Bundle/chunks | Warn | main JS 505.08 kB / 158.82 kB gzip; lazy 3D chunk 906.61 kB / 245.40 kB gzip |
| Local production navigation | Pass, desktop sample only | 10 runs: load p50 82.04 ms, p95 1511.62 ms; first cold run dominates p95 |
| Camera/responsive e2e | Pass | 9/9 serial run: five camera flows plus 320 px, keyboard-focus, reduced-motion, and claims checks |
| 320 px reflow | Pass automated | no horizontal overflow in Playwright |
| Keyboard focus | Pass automated, partial | first interactive control receives a non-zero visible outline |
| Reduced motion | Pass automated | rendered maximum animation/transition duration <= 0.01 ms |
| Screen reader | **Not run** | NVDA/VoiceOver requires a named human/device pass; no claim made |
| Contrast | Partial | existing token/manual audit retained; no full rendered contrast scanner installed |
| Browser support | Partial | Chromium/desktop plus emulated responsive viewports only; Firefox/WebKit/device hardware unverified |
| Claims/copy | Pass for observed blocker | removed “motion lab,” patient/PT targeting, and “validated reps” landing claims; e2e guard added |
| Production dependency audit | Pass | `npm audit --omit=dev`: zero vulnerabilities |
| Full dependency audit | **Warn/fail** | 6 dev-tool advisories remain: 2 critical, 1 high, 3 moderate |
| Safe transitive remediation | Pass | non-major lock updates removed Babel, form-data, and ws advisories |
| Breaking dependency remediation | Blocked by approval | Vite 8/Vitest 4 majors required; no `--force` run |
| COOP/COEP local preview | Pass | response sends COOP `same-origin`, COEP `require-corp` |
| COOP/COEP production | **Not run** | no authorized production URL found in repository |
| Dataset availability | Pass with limitations | UI-PRMD reduced baseline available locally; OCHuman and sit-to-stand data unavailable as documented |
| Proprietary corpus governance | Pass as plan only | `PROPRIETARY_CORPUS_GOVERNANCE.md`; no collection authorized or performed |
| Diff/media/secret hygiene | Pending final closeout | run after final verification |

## Dependency reachability decision

The audit reports zero production dependency vulnerabilities. Remaining paths
are Vite/Vitest/esbuild/vite-node/mocker/coverage development or test tooling.
The critical Vitest advisory concerns an exposed Vitest UI server; this project’s
scripts run headless `vitest run` and do not define a UI-server script. Vite
advisories still matter to developers: bind local servers only to loopback, do not
open untrusted sites concurrently with a development server, and schedule the
major migration. This explains reachability; it does not erase the advisories.

An isolated workspace copy tested the exact candidate set: Vite 8.1.4, Vitest
4.1.10, coverage-v8 4.1.10, plugin-react 6.0.3, and vite-node 6.0.0. In that
copy, audit reported zero vulnerabilities, the build completed in 2.98 seconds,
all 529 tests passed, coverage remained above thresholds (87.52% lines, 81.62%
branches, 92.03% functions, 86.29% statements), the UI-PRMD pilot ran, and the
11-tape/9-of-9 baseline held. This is high-confidence compatibility evidence,
but the repository migration remains an explicit M75 approval boundary.

## Performance interpretation

The local headless measurement is an instrumentation smoke test, not a support
budget. It excludes network latency, MediaPipe model download/inference, camera
hardware, mobile thermals, and real-device browsers. The large 3D chunk is lazy;
the main chunk still exceeds Vite’s 500 kB warning. No worker or manual chunking
change is justified without route/model traces on target devices.

## Required decisions before a release-ready claim

1. Approve an isolated Vite 8/Vitest 4 migration or accept a time-bounded dev-only
   exception with loopback controls.
2. Name supported browsers/devices and complete at least Chromium plus one real
   mobile device; add Firefox/WebKit only if they are intended support targets.
3. Complete NVDA or VoiceOver flow testing and rendered contrast review.
4. Provide/authorize the production URL for read-only COOP/COEP verification.

No deployment, production mutation, data collection, or protocol activation was
performed by M74.
