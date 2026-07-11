# Post-Dataset-Research Gaps

These questions can change architecture, claims, dataset choice, or milestone scope. They are not implementation tasks until the named evidence exists.

| ID | Open question | Decision affected | Evidence needed | Owner milestone | Current confidence/status |
|---|---|---|---|---|---|
| G-01 | Which official licenses permit KinematicIQ’s exact local commercial evaluation use? | Dataset role and legal usability | Terms captured at access time + counsel decision | M61 | unknown; approval checkpoint |
| G-02 | Which OpenCap/UI-PRMD files contain synchronized video/reference channels usable without reconstruction ambiguity? | First biomechanics pilot | File-level inspection after approved access | M63 | medium from papers; unverified files |
| G-03 | What semantic joint definition should KinematicIQ use for hip/knee/ankle comparisons? | Skeleton adapters and angle error | Dataset docs, OpenSim conventions, code mapping review | M62 | open |
| G-04 | How should dropped detections be represented in offline time series? | Dropout, filtering, event timing | Experiment with explicit missing frames vs compressed sequence | M62-M64 | open/high impact |
| G-05 | What jitter metric separates estimator noise from true motion? | Filter adoption | Static/known-smooth segments + reference waveform | M62-M64 | open |
| G-06 | What per-metric error/lag is acceptable for coaching-grade use? | Acceptance thresholds/claims | Predeclared product question + expert/lab review | M64 | unknown; do not invent |
| G-07 | Which browsers/devices are target support tiers? | Performance budgets and responsive matrix | Product owner decision + observed device runs | M64/M74 | unknown |
| G-08 | Is the squat protocol front-view, side-view, or view-specific by metric? | Camera setup, eligibility, copy, validation subsets | Doctrine decision backed by metric sensitivity benchmark | M64/M66 | conflicted today |
| G-09 | Should analyst/debug controls ship to normal users? | Camera/results hierarchy and bundle | User/audience decision + usability evidence | M67 | open |
| G-10 | Which Results section is canonical when content duplicates? | Narrative/evidence IA | Content inventory + user/expert task review | M68 | open |
| G-11 | Which metric/question justifies the first waveform or phase visualization? | M69 scope | Validation status + user question + event alignment | M68-M69 | open |
| G-12 | Can `ProtocolRuntime` remain five stages, or must it own setup/activation/completion/storage/report configuration? | Protocol contract v3 | Contract audit + sit-to-stand research package | M70-M71 | likely expansion; not decided |
| G-13 | Is repeated chair-rise best modeled as cyclic or transition trials? | Sit-to-stand engine | Labeled UI-PRMD/OpenCap/local sequences and failure simulation | M71 | unknown |
| G-14 | What sit-to-stand observations are reliable from consumer RGB? | Product scope/metrics | Reference comparison + repeated measures | M71-M72 | count/timing plausible; not validated |
| G-15 | What expert label ontology/inter-rater target is sufficient for coaching? | Sit-to-stand/hinge coaching | Annotation protocol, ≥2 raters, agreement analysis | M71-M73 | unknown |
| G-16 | Which first proprietary corpus participants/devices/edge cases are essential? | Data collection plan | Sampling/risk matrix and consent/privacy review | M61/M74 | open |
| G-17 | Are current npm vulnerabilities reachable in a browser-only build? | Dependency remediation | `npm audit` package-path analysis and changelogs | M74 | unknown; current count known |
| G-18 | Do Vercel production responses preserve required COOP/COEP headers? | MediaPipe/worker performance | Read-only production header verification when authorized | M74 | unverified |
| G-19 | How does the current product perform with NVDA/VoiceOver and high zoom? | Accessibility claims | Manual assistive-tech walkthrough | M67-M69/M74 | unverified |
| G-20 | Does Graphify add useful architecture evidence for this repo? | Future audit tooling | Explicitly authorized subagent run or code-only scoped graph | future | not run; policy conflict in this session |

## Closed by this audit

| Question | Answer/evidence | Decision |
|---|---|---|
| Does KinematicIQ need a full Aurelian template install? | Existing canonical docs are richer; root AGENTS/.aurelian were absent | Compatibility layer, ADR-009 |
| Is the repo current with remote master? | Fetch/pull showed current; local branch 17 commits ahead | Audit SHA fixed at `d053203` |
| Is sit-to-stand automatically ready because datasets exist? | Runtime/live flow and labels/reliability are incomplete | Research package first; M71 before M72 |
| Must all UI wait for dataset infrastructure? | Camera/report issues are visible and behavior-characterizable now | M66 can run parallel after M62 contract; M67/M68 need not wait for all external pilots |
| Can a model/filter change proceed now? | No saved baseline/reference-angle benchmark | M65 blocked by M63-M64 evidence |
