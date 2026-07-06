# M8 — Results UX v1 (progressive disclosure)

## What changed

ResultsScreen now uses a three-tab progressive-disclosure layout (Summary / Evidence /
Expert) per `11_Product_Experience_Bible.md`, replacing the old single-page layout with
its "Analyst mode" toggle. Findings from M7 are rendered as cards on the Summary tab;
the M6 `MetricResult[]` list is rendered on the Evidence tab.

- **Summary tab**: verdict/abstain banner, session confidence, finding cards (top 3,
  primary-first via `sortFindings`), coaching cues. When the quality gate abstains,
  the abstain message is shown and no findings render (M7 engine already returns none).
- **Evidence tab**: per-metric results (`MetricResult[]`, abstained/null values hidden),
  legacy metrics summary, posture profile, rep-by-rep detail.
- **Expert tab**: everything the old Analyst mode showed — session replay, rejection
  diagnostics, quality-gate reasons, raw confidence values. `isAnalyst` is now derived
  from `activeTab === 'expert'`, so all previous analyst-gated blocks moved here without
  content changes.

## Files touched

- `web/src/components/report/resultsTabsModel.ts` (new) — tab definitions,
  `summaryFindings`, `evidenceMetricResults`, `hasFindings`.
- `web/src/components/report/resultsTabsModel.test.ts` (new) — tab order/default,
  summary sort+cap, null-value filtering, abstain ⇒ no findings.
- `web/src/components/report/ResultsTabs.tsx` (new) — tab nav component.
- `web/src/components/report/findingCardModel.ts` (new) — pure view model.
- `web/src/components/report/FindingCard.tsx` (new) — finding card component.
- `web/src/screens/ResultsScreen.tsx` — tabbed layout, sections regrouped.
- `web/src/index.css` — styles for tabs, finding cards, metric rows.

## Decisions / issues

- **Windows case collision**: the tab-model module was initially named
  `resultsTabs.ts`, which differs from the `ResultsTabs.tsx` component only by casing —
  tsc raised TS1149/TS1261 on the case-insensitive filesystem. Renamed the model to
  `resultsTabsModel.ts`.
- No composite score anywhere in the new UI (hard constraint); Summary shows the
  quality verdict + per-finding confidence chips only.
- DisclaimerBanner and abstain copy untouched.

## Tests

- Before: 41 files / 225 tests. After: 42 files / 231 tests. Build + tests green.
