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

// ── Coach-question organization (M24, docs/24 §4) ───────────────────
//
// The report answers the questions a coach actually asks, in a fixed
// order. A question with no findings still renders — with an explicit
// per-question abstain line — so silence is always deliberate.

export interface CoachQuestionSection {
  questionId: string
  title: string
  /** What this question asks, in athlete-readable copy. */
  asks: string
  findings: Finding[]
  /** Rendered when `findings` is empty for a valid set. */
  abstainLine: string
}

const QUESTION_SECTIONS: ReadonlyArray<
  Omit<CoachQuestionSection, 'findings'>
> = [
  {
    questionId: 'movement-completion',
    title: 'Did you complete the movement?',
    asks: 'Depth, range, and rep-to-rep repeatability.',
    abstainLine:
      'Nothing to flag here — depth and consistency reads stayed inside the expected range.',
  },
  {
    questionId: 'posture-organization',
    title: 'How was your posture organized?',
    asks: 'Trunk position and how it held through the set.',
    abstainLine:
      'Nothing to flag here — the trunk reads stayed inside the expected range.',
  },
  {
    questionId: 'load-symmetry',
    title: 'Was the effort even side to side?',
    asks: 'Left/right knee bend and lateral hip position.',
    abstainLine:
      'Nothing to flag here — the side-to-side reads stayed inside the expected range.',
  },
]

/**
 * Findings grouped under the coach questions, fixed question order,
 * findings sorted by priority inside each. Questions the current findings
 * don't map to are still returned (empty + abstain line). Findings with an
 * unknown question id are appended under the last matching-known section's
 * order — today every rule maps to one of the three questions.
 */
export function coachQuestionSections(
  result: SessionResult,
): CoachQuestionSection[] {
  const sorted = sortFindings(result.findings)
  return QUESTION_SECTIONS.map((section) => ({
    ...section,
    findings: sorted.filter((f) => f.question === section.questionId),
  }))
}
