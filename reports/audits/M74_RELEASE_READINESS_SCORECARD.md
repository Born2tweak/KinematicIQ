# M74 Release-Readiness Scorecard

**Run date:** 2026-07-11; bounded accessibility automation extended 2026-07-12

**Decision:** **Not release-ready**; local engineering gates and the approved
dev-toolchain remediation pass, but manual assistive-technology evidence and an
authorized production URL/header check remain open.

| Gate | Result | Current-session evidence |
|---|---|---|
| Production build | Pass | Vite 8.1.4; 713 modules; latest build completed in 544 ms |
| Bundle/chunks | Warn | main JS 515.83 kB / 159.85 kB gzip; lazy 3D chunk 893.62 kB / 238.25 kB gzip |
| Local production navigation | Pass, desktop sample only | 10 runs: load p50 82.04 ms, p95 1511.62 ms; first cold run dominates p95 |
| Camera/responsive e2e | Pass automated | 56/56 applicable support tests pass across four projects; Chromium, Firefox, desktop WebKit, and iPhone WebKit complete the clean pose-tape workflow; a separate Chromium fake-`getUserMedia` smoke passes with a generated synthetic `.y4m` |
| 320 px reflow | Pass automated | no horizontal overflow in Playwright |
| Keyboard focus | Pass for complete primary landing cycle; partial overall | each browser's complete tab cycle contains at least eight unique interactive controls and every control receives a non-zero visible outline |
| Reduced motion | Pass automated | rendered maximum animation/transition duration <= 0.01 ms |
| Screen reader | **Pending human execution** | exact NVDA Chrome/Firefox and physical iPhone VoiceOver scripts exist; no result fabricated |
| Contrast | Pass for primary landing surfaces; partial overall | rendered WCAG AA ratios gate hero copy, eyebrow, navigation, and primary/secondary CTAs; the first accurate gradient-stop check found the primary CTA at 3.95:1 and the shared gradient was darkened before the passing rerun; full-route manual review remains |
| Browser support | Partial | automated Chromium, Firefox, desktop WebKit, and iPhone WebKit emulation; physical iPhone Safari remains pending |
| Claims/copy | Pass for observed blocker | removed “motion lab,” patient/PT targeting, and “validated reps” landing claims; e2e guard added |
| Production dependency audit | Pass | `npm audit --omit=dev`: zero vulnerabilities |
| Full dependency audit | Pass | zero vulnerabilities after approved M75 migration |
| Safe transitive remediation | Pass | non-major lock updates removed Babel, form-data, and ws advisories |
| Breaking dependency remediation | Pass | owner-approved Vite 8.1.4, Vitest/coverage 4.1.10, plugin-react 6.0.3, and vite-node 6.0.0; no `--force` run |
| COOP/COEP local preview | Pass | response sends COOP `same-origin`, COEP `require-corp` |
| COOP/COEP production | **Not run** | no authorized production URL found in repository |
| Dataset availability | Pass with limitations | UI-PRMD reduced baseline and official LLM-FMS m05/m06 keyframes available locally; original timed UI-PRMD, OCHuman corpus, and sit-to-stand data unavailable as documented |
| Proprietary corpus governance | Pass as plan only | `PROPRIETARY_CORPUS_GOVERNANCE.md`; no collection authorized or performed |
| Diff/media/secret hygiene | Pending final closeout | run after final verification |

## Dependency reachability decision

The approved repository migration now uses Vite 8.1.4, Vitest/coverage 4.1.10,
plugin-react 6.0.3, and vite-node 6.0.0. Full and production audits report zero
vulnerabilities. The build completed in 808 ms; all 529 tests passed; coverage
remained above thresholds (87.52% lines, 81.62% branches, 92.03% functions,
86.29% statements); the UI-PRMD pilot produced 90 trials/class and 2,527,200
paired samples; and the 11-tape/9-of-9 baseline held. The 10-test camera and
release-readiness Playwright matrix also passes.

## Performance interpretation

The local headless measurement is an instrumentation smoke test, not a support
budget. It excludes network latency, MediaPipe model download/inference, camera
hardware, mobile thermals, and real-device browsers. The large 3D chunk is lazy;
the main chunk still exceeds Vite’s 500 kB warning. No worker or manual chunking
change is justified without route/model traces on target devices.

## Required decisions before a release-ready claim

1. Execute the physical iPhone Safari/VoiceOver and Windows NVDA scripts.
2. Complete the full-route human rendered-contrast review.
3. Provide/authorize the production URL for read-only COOP/COEP verification.

No deployment, production mutation, data collection, or protocol activation was
performed by M74.
