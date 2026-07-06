/**
 * Results progressive-disclosure tabs (M8) — Summary / Evidence / Expert.
 *
 * Pure gating logic so tab behavior is unit-testable without a DOM. The screen
 * renders the tab bar and panels from these definitions; abstain behavior is
 * unchanged (an invalid set carries no findings/metricResults, so those panels
 * render nothing but the abstain reasons + diagnostics stay reachable).
 *
 * Design source: docs/research/11_Product_Experience_Bible.md §3/§5.
 */
import { sortFindings, type Finding } from '../../core/finding'
import { hasValue, type MetricResult } from '../../core/metric'
import type { SessionResult } from '../../session/types'

export type ResultsTabId = 'summary' | 'evidence' | 'expert'

export interface ResultsTab {
  id: ResultsTabId
  label: string
}

export const RESULTS_TABS: ResultsTab[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'expert', label: 'Expert' },
]

export const DEFAULT_RESULTS_TAB: ResultsTabId = 'summary'

/** Top findings for the Summary tab (sorted primary→informational, capped). */
export function summaryFindings(result: SessionResult, max = 3): Finding[] {
  return sortFindings(result.findings).slice(0, max)
}

/** Metric results with a usable value, for the Evidence tab. */
export function evidenceMetricResults(result: SessionResult): MetricResult[] {
  return result.metricResults.filter(hasValue)
}

/** Whether the Summary tab has coaching findings to show (valid sets only). */
export function hasFindings(result: SessionResult): boolean {
  return result.findings.length > 0
}
