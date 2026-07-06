/**
 * Squat finding rules (M7).
 *
 * Turns the squat's per-component evidence into `Finding[]` with an explicit
 * evidence chain (which `MetricResult`s triggered each finding), and derives the
 * `CoachingCue[]` FROM those findings in the same pass — so the rendered
 * coaching copy is byte-identical to the pre-M7 output (the cue text still comes
 * from `buildBiomechanicalCue`; a finding is that observation + its evidence,
 * a cue is that finding + its coaching template).
 *
 * Design sources: docs/research/04_Coaching_Intelligence_Engine_Spec.md §4–7/§9
 * (metrics→meaning, evidence chains), docs/24 §4 (coach questions),
 * claims-policy (observation language, confidence gating, abstain).
 */
import type { CoachingCue, ComponentScores, ConfidenceLevel, SetMetricsSummary } from '../session/types'
import { buildBiomechanicalCue, lowestComponents } from '../feedback/feedbackReasoning'
import type { FeedbackIssueKey } from '../feedback/feedbackTemplates'
import { makeConfidence } from '../core/confidence'
import type { MetricResult } from '../core/metric'
import type { Finding, FindingEvidenceRef, FindingPriority } from '../core/finding'

/** Coach question each component maps to (docs/24 §4). */
const QUESTION_BY_KEY: Record<FeedbackIssueKey, string> = {
  depth: 'movement-completion',
  trunkControl: 'posture-organization',
  kneeTracking: 'load-symmetry',
  consistency: 'movement-completion',
  symmetry: 'load-symmetry',
}

/** MetricResult ids that constitute the evidence chain for each component. */
const EVIDENCE_METRIC_IDS_BY_KEY: Record<FeedbackIssueKey, string[]> = {
  depth: ['squat.depth.min-knee-angle', 'squat.depth.cv'],
  trunkControl: ['squat.trunk.avg-lean'],
  kneeTracking: ['squat.symmetry.knee-asymmetry'],
  consistency: ['squat.depth.cv'],
  symmetry: ['squat.symmetry.hip-shift'],
}

/** Numeric confidence for the finding, derived from the cue's chip. */
const CONFIDENCE_VALUE: Record<ConfidenceLevel, number> = {
  High: 0.8,
  Medium: 0.6,
  Low: 0.35,
}

function evidenceRefs(
  key: FeedbackIssueKey,
  metricResults: readonly MetricResult[],
): FindingEvidenceRef[] {
  const ids = EVIDENCE_METRIC_IDS_BY_KEY[key]
  return ids.map((metricId): FindingEvidenceRef => {
    const result = metricResults.find((r) => r.metricId === metricId)
    const observed =
      result && result.value !== null
        ? `${result.label}: ${Math.round(result.value * 100) / 100}${result.unit === 'deg' ? '°' : result.unit === 'percent' ? '%' : ''}`
        : 'not readable in this set'
    return { metricId, observed }
  })
}

export interface SquatCoaching {
  findings: Finding[]
  cues: CoachingCue[]
}

/**
 * Derive squat findings and their cues together. Returns empty for both when
 * session confidence is Low (matching the pre-M7 `generateFeedback` guard) —
 * the higher-level quality-gate abstain is enforced by the caller.
 */
export function deriveSquatCoaching(
  components: ComponentScores,
  sessionConfidence: ConfidenceLevel,
  metrics: SetMetricsSummary,
  metricResults: readonly MetricResult[] = [],
  maxCues = 2,
): SquatCoaching {
  if (sessionConfidence === 'Low') {
    return { findings: [], cues: [] }
  }

  const keys = lowestComponents(components, maxCues)
  const findings: Finding[] = []
  const cues: CoachingCue[] = []

  keys.forEach((key, index) => {
    const cue = buildBiomechanicalCue(key, metrics, sessionConfidence)
    cues.push({
      issue: cue.issue,
      observed: cue.observed,
      whyItMatters: cue.whyItMatters,
      tryNext: cue.tryNext,
      confidence: cue.confidence,
      confidenceNote: cue.confidenceNote,
    })

    const priority: FindingPriority = index === 0 ? 'primary' : 'secondary'
    findings.push({
      id: `squat.${key}`,
      question: QUESTION_BY_KEY[key],
      statement: cue.observed,
      evidence: evidenceRefs(key, metricResults),
      confidence: makeConfidence(CONFIDENCE_VALUE[cue.confidence]),
      priority,
      tryNext: cue.tryNext,
    })
  })

  appendTempoFinding(findings, sessionConfidence, metrics, metricResults)

  return { findings, cues }
}

/** Rep-duration CV above this reads as erratic tempo worth surfacing. */
const TEMPO_CV_INFORMATIONAL = 40

/**
 * Erratic-tempo finding (M18): informational only — it rides the tempo
 * metrics, never displaces the primary/secondary coaching cues, and needs a
 * real sample (3+ reps) before saying anything.
 */
function appendTempoFinding(
  findings: Finding[],
  sessionConfidence: ConfidenceLevel,
  metrics: SetMetricsSummary,
  metricResults: readonly MetricResult[],
): void {
  const tempoCV = metrics.repDurationCV ?? null
  if (tempoCV === null || tempoCV <= TEMPO_CV_INFORMATIONAL) return
  if (metrics.repCount < 3) return

  const repDuration = metricResults.find(
    (r) => r.metricId === 'squat.tempo.rep-duration',
  )
  findings.push({
    id: 'squat.tempo',
    question: 'movement-completion',
    statement: `Rep timing varied by about ${Math.round(tempoCV)}% across this set — some reps took noticeably longer than others.`,
    evidence: [
      {
        metricId: 'squat.tempo.rep-duration',
        observed:
          repDuration && repDuration.value !== null
            ? `Rep duration (avg): ${(Math.round(repDuration.value * 100) / 100).toFixed(2)} s`
            : 'not readable in this set',
      },
    ],
    confidence: makeConfidence(CONFIDENCE_VALUE[sessionConfidence]),
    priority: 'informational',
    tryNext:
      'Pick a tempo — for example two seconds down, brief pause, drive up — and keep it for every rep.',
  })
}
