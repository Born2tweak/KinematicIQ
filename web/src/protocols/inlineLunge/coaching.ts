/**
 * Forward-lunge coaching cues (KQ-027).
 *
 * Cues are derived FROM findings and metric results, never authored beside
 * them, so the report cannot say something its evidence does not support.
 *
 * Every cue on this protocol carries the same confidence note: the analysis has
 * never been measured against reference data. That note is not decoration — it
 * is the reason none of this copy is allowed to describe a movement as good,
 * safe, correct, or improved. Cues here describe what this recording showed and
 * what to change about the *capture* or the *tempo* to make the next recording
 * comparable.
 */
import type { MetricResult } from '../../core/metric'
import type { Finding } from '../../core/finding'
import type { CoachingCue } from '../../session/types'

const EXPERIMENTAL_NOTE =
  'Forward Lunge is experimental — this read has not been benchmarked against reference data.'

/** Above this within-set spread the timing difference is worth describing. */
const NOTABLE_DURATION_CV_PERCENT = 15

const valueOf = (metrics: readonly MetricResult[], id: string): number | null =>
  metrics.find((metric) => metric.metricId === id)?.value ?? null

export function deriveForwardLungeCues(
  metricResults: readonly MetricResult[],
  findings: readonly Finding[],
): CoachingCue[] {
  if (findings.length === 0) return []

  const cues: CoachingCue[] = []
  const trials = valueOf(metricResults, 'forwardLungeStrideReturn.trial.count')
  const durationCv = valueOf(metricResults, 'forwardLungeStrideReturn.tempo.duration-cv')
  const kneeAngle = valueOf(metricResults, 'forwardLungeStrideReturn.knee.bottom-angle')
  const confidence =
    metricResults.find((metric) => metric.value !== null)?.confidence.level ?? 'Low'

  if (durationCv !== null && durationCv > NOTABLE_DURATION_CV_PERCENT) {
    cues.push({
      issue: 'Trial timing varied across the set',
      observed: `Step-to-return duration varied by ${durationCv.toFixed(1)}% across the complete trials in this recording.`,
      whyItMatters:
        'An even tempo makes two sets comparable to each other. Uneven timing here describes this recording only — it is not a judgement about the movement.',
      tryNext:
        'Record another set at a deliberate, even tempo and compare the same duration read.',
      confidence,
      confidenceNote: EXPERIMENTAL_NOTE,
    })
  }

  if (kneeAngle !== null) {
    cues.push({
      issue: 'Lead-knee angle is a single-camera estimate',
      observed: `The lead knee read about ${Math.round(kneeAngle)}° at the detected bottom of the trial.`,
      whyItMatters:
        'This is a projected 2-D angle from one side view, so movement toward or away from the camera changes it. It is not a joint-angle measurement.',
      tryNext:
        'Keep the camera square to your side, near hip height, with both feet in frame for the whole set.',
      confidence,
      confidenceNote: EXPERIMENTAL_NOTE,
    })
  }

  if (trials !== null && trials < 3) {
    cues.push({
      issue: 'Few complete trials in this recording',
      observed: `${trials} complete step-to-return ${trials === 1 ? 'trial was' : 'trials were'} observed, so within-set variation could not be described.`,
      whyItMatters:
        'Within-set consistency reads need at least three complete trials before they describe a pattern rather than a single attempt.',
      tryNext: 'Record at least three complete lunges in one continuous clip.',
      confidence,
      confidenceNote: EXPERIMENTAL_NOTE,
    })
  }

  return cues.slice(0, 3)
}
