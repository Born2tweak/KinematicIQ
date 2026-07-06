import type {
  ComponentScores,
  ConfidenceLevel,
  SetMetricsSummary,
} from '../session/types'
import {
  CONSISTENCY_CV_THRESHOLDS,
  DEPTH_THRESHOLDS,
  HIP_SHIFT_THRESHOLDS,
  KNEE_ASYMMETRY_IMPLAUSIBLE,
  KNEE_ASYMMETRY_THRESHOLDS,
  TRUNK_THRESHOLDS,
} from '../scoring/scoringConfig'
import type { FeedbackIssueKey } from './feedbackTemplates'

export interface BiomechanicalCue {
  issue: string
  observed: string
  whyItMatters: string
  tryNext: string
  confidence: ConfidenceLevel
  confidenceNote: string | null
}

const parallelNote = (avgDepth: number): string =>
  avgDepth > DEPTH_THRESHOLDS.goodMax
    ? 'above roughly parallel thigh level'
    : 'short of your deeper reps in this set'

function formatDegrees(value: number): string {
  return `${Math.round(value)}°`
}

function trunkLeanSpread(metrics: SetMetricsSummary): number | null {
  const values = metrics.reps
    .map((rep) => rep.averageTrunkLean)
    .filter((v): v is number => v !== null)
  if (values.length < 2) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function deeperKneeSide(metrics: SetMetricsSummary): 'left' | 'right' | 'even' {
  let leftSum = 0
  let rightSum = 0
  let count = 0
  for (const rep of metrics.reps) {
    if (rep.minLeftKneeAngle !== null && rep.minRightKneeAngle !== null) {
      leftSum += rep.minLeftKneeAngle
      rightSum += rep.minRightKneeAngle
      count += 1
    }
  }
  if (count === 0) return 'even'
  const leftAvg = leftSum / count
  const rightAvg = rightSum / count
  const gap = Math.abs(leftAvg - rightAvg)
  if (gap < 5) return 'even'
  return leftAvg < rightAvg ? 'left' : 'right'
}

function confidenceNote(level: ConfidenceLevel): string | null {
  if (level === 'Medium') {
    return 'Camera confidence was moderate in this set — treat this as directional feedback, not a precise measurement.'
  }
  return null
}

export const MISSING_DATA_NOTE =
  'The camera did not capture enough of this read in this set — treat this as a setup check, not a measurement.'

/**
 * Confidence belongs to the claim, not the session: when the primary
 * observation behind a cue is unavailable, the cue can never exceed Low,
 * no matter how visible the athlete was overall. Session confidence only
 * applies when the claim's own data exists.
 */
function claimGated(
  dataAvailable: boolean,
  session: ConfidenceLevel,
): Pick<BiomechanicalCue, 'confidence' | 'confidenceNote'> {
  if (!dataAvailable) {
    return { confidence: 'Low', confidenceNote: MISSING_DATA_NOTE }
  }
  return { confidence: session, confidenceNote: confidenceNote(session) }
}

function buildDepthCue(
  metrics: SetMetricsSummary,
  confidence: ConfidenceLevel,
): BiomechanicalCue {
  const avg = metrics.avgDepth
  const min = metrics.minDepth
  const max = metrics.maxDepth
  const cv = metrics.depthCV

  const shallow =
    avg !== null && avg > DEPTH_THRESHOLDS.goodMax
  const inconsistent =
    cv !== null && cv > CONSISTENCY_CV_THRESHOLDS.goodMax && metrics.repCount >= 2

  if (inconsistent && !shallow) {
    return {
      issue: 'Depth',
      observed: `Depth varied rep to rep (about ${cv!.toFixed(0)}% spread). Deepest knee bend was ${min !== null ? formatDegrees(min) : 'unclear'}; shallowest was ${max !== null ? formatDegrees(max) : 'unclear'}.`,
      whyItMatters:
        'Squat depth is how far your hips sit at the bottom — the more your knees bend, the deeper the rep. When depth jumps around, the set is harder to compare rep to rep.',
      tryNext:
        'Pick a target depth before the set and hit the same bottom position each rep — pause one second at the bottom to feel it.',
      confidence,
      confidenceNote: confidenceNote(confidence),
    }
  }

  if (shallow && avg !== null) {
    const depthPhrase =
      min !== null && min <= DEPTH_THRESHOLDS.goodMax
        ? `Your deepest rep reached about ${formatDegrees(min)}, but the set average stayed around ${formatDegrees(avg)} — several reps stayed ${parallelNote(avg)}.`
        : `Your lowest-depth reps stayed around ${formatDegrees(avg)} knee bend (${parallelNote(avg)}), so the camera read most of the set as shallower.`

    return {
      issue: 'Depth',
      observed: depthPhrase,
      whyItMatters:
        'Limited hip flexion means the squat moves through less range of motion. From the side view, the camera reads thigh angle — when the hips do not sit as low, the camera reads less depth even if the rep felt effortful.',
      tryNext:
        'Sit the hips slightly lower while keeping your chest controlled — think “hips back and down” rather than only bending the knees.',
      confidence,
      confidenceNote: confidenceNote(confidence),
    }
  }

  return {
    issue: 'Depth',
    observed:
      avg !== null
        ? `Average bottom knee bend was about ${formatDegrees(avg)} in this set.`
        : 'The camera could not read a clear bottom knee angle on every rep.',
    whyItMatters:
      'Depth is read from the smallest knee angle at the bottom of each rep. Less bend usually means the hips did not travel as far in the squat pattern.',
    tryNext:
      'Film from the side, brace your core, and aim for the same hip height on each rep.',
    ...claimGated(avg !== null, confidence),
  }
}

function buildTrunkCue(
  metrics: SetMetricsSummary,
  confidence: ConfidenceLevel,
): BiomechanicalCue {
  const avg = metrics.avgTrunkLean
  const spread = trunkLeanSpread(metrics)
  const forwardLean =
    avg !== null && avg > TRUNK_THRESHOLDS.goodMax
  const variableTrunk =
    spread !== null && spread > 12 && metrics.repCount >= 2

  if (variableTrunk && forwardLean && avg !== null) {
    return {
      issue: 'Trunk control',
      observed: `Chest lean averaged about ${formatDegrees(avg)} and changed noticeably between reps (roughly ${formatDegrees(spread!)} spread).`,
      whyItMatters:
        'A forward torso means your chest drops toward the floor through the descent. When lean changes rep to rep, your bracing and balance look less repeatable from the camera.',
      tryNext:
        'Take a breath at the top, brace your ribs down, and keep the same chest angle through the descent and drive up.',
      confidence,
      confidenceNote: confidenceNote(confidence),
    }
  }

  if (forwardLean && avg !== null) {
    return {
      issue: 'Trunk control',
      observed: `Your chest leaned forward about ${formatDegrees(avg)} on average during the squat — more than the upright trunk range the app expects.`,
      whyItMatters:
        'Extra forward lean makes the squat look more like a hinge, with the hips traveling back while the chest tips toward the floor. The camera reads trunk angle from shoulder to hip, so a tipped chest appears as more forward lean.',
      tryNext:
        'Keep your ribs stacked over your pelvis and look slightly ahead — “chest tall” on the way down and up.',
      confidence,
      confidenceNote: confidenceNote(confidence),
    }
  }

  return {
    issue: 'Trunk control',
    observed:
      avg !== null
        ? `Trunk angle averaged about ${formatDegrees(avg)} across the set.`
        : 'Trunk angle was not visible on every rep.',
    whyItMatters:
      'A stable trunk keeps your chest and hips moving together instead of folding at the waist.',
    tryNext:
      'Brace before each rep and keep the same torso angle from start to finish.',
    ...claimGated(avg !== null, confidence),
  }
}

function buildKneeTrackingCue(
  metrics: SetMetricsSummary,
  confidence: ConfidenceLevel,
): BiomechanicalCue {
  const asym = metrics.avgKneeAsymmetry
  const side = deeperKneeSide(metrics)

  // Plausibility guard: a sustained gap this large is a camera-view read
  // (far knee foreshortened through the near leg), not a movement claim
  // the app can vouch for. Reframe as a capture observation at Low
  // confidence instead of confident coaching.
  if (asym !== null && asym >= KNEE_ASYMMETRY_IMPLAUSIBLE) {
    return {
      issue: 'Knee tracking',
      observed: `Left and right knee bend differed by about ${formatDegrees(asym)} on average — a gap this large usually means the camera angle hid or foreshortened one leg, not that your legs moved that differently.`,
      whyItMatters:
        'From an angled or side-on view, the far knee is read through the near leg, which exaggerates left–right differences. The app reports only what the camera can vouch for, and this read looks like a viewing-angle artifact.',
      tryNext:
        'Re-record facing the camera straight on with both knees clearly visible, then check knee tracking again.',
      confidence: 'Low',
      confidenceNote:
        'This left–right difference is beyond what a squat plausibly produces — treat it as a camera-setup check, not a movement read.',
    }
  }

  if (asym !== null && asym > KNEE_ASYMMETRY_THRESHOLDS.excellentMax) {
    const sideNote =
      side === 'even'
        ? 'One knee consistently bent more than the other at the bottom.'
        : side === 'left'
          ? 'The left knee reached a deeper bend than the right on most reps.'
          : 'The right knee reached a deeper bend than the left on most reps.'

    return {
      issue: 'Knee tracking',
      observed: `${sideNote} Average left–right knee difference was about ${formatDegrees(asym)}.`,
      whyItMatters:
        'Even knee bend keeps both legs moving through the same range. When one knee stays straighter than the other, your hips or that knee may drift toward one side — the app reads that as a left–right difference in this set, not a medical diagnosis.',
      tryNext:
        'Spread the floor with your feet and drive both knees toward your second toe at the same rate — match the deeper side instead of letting one knee dive in.',
      confidence,
      confidenceNote: confidenceNote(confidence),
    }
  }

  return {
    issue: 'Knee tracking',
    observed:
      asym !== null
        ? `Left and right knee bend differed by about ${formatDegrees(asym)} on average.`
        : 'Knee angles were not clear on both sides for every rep.',
    whyItMatters:
      'Balanced knee bend keeps the squat centered over your base of support.',
    tryNext:
      'Film from the front or a slight angle and aim for matching knee paths each rep.',
    ...claimGated(asym !== null, confidence),
  }
}

function buildConsistencyCue(
  metrics: SetMetricsSummary,
  confidence: ConfidenceLevel,
): BiomechanicalCue {
  const cv = metrics.depthCV

  if (cv !== null && metrics.repCount >= 2) {
    return {
      issue: 'Consistency',
      observed: `Rep depth varied by about ${cv.toFixed(0)}% in this set${metrics.minDepth !== null && metrics.maxDepth !== null ? ` (from ${formatDegrees(metrics.minDepth)} to ${formatDegrees(metrics.maxDepth)} knee bend)` : ''}.`,
      whyItMatters:
        'Repeatable depth makes each rep train the same range of motion. Large rep-to-rep changes make the pattern less predictable from the camera.',
      tryNext:
        'Use the same tempo each rep — control the descent, pause briefly at your chosen depth, then stand.',
      confidence,
      confidenceNote: confidenceNote(confidence),
    }
  }

  return {
    issue: 'Consistency',
    observed: 'Not enough reps with readable depth to judge consistency.',
    whyItMatters:
      'Consistency compares bottom positions across reps. Fewer than two tracked reps limits that comparison.',
    tryNext:
      'Complete at least two full reps in frame with the same setup.',
    ...claimGated(false, confidence),
  }
}

function buildSymmetryCue(
  metrics: SetMetricsSummary,
  confidence: ConfidenceLevel,
): BiomechanicalCue {
  const shift = metrics.avgHipShift

  if (shift !== null && shift > HIP_SHIFT_THRESHOLDS.excellentMax) {
    return {
      issue: 'Symmetry',
      observed: `Hips shifted sideways about ${(shift * 100).toFixed(0)}% of frame width at the bottom — your hips drifted toward one side.`,
      whyItMatters:
        'Keeping your hips centered over your feet keeps the movement even side-to-side. A lateral shift means one hip traveled further sideways than the other in the squat pattern.',
      tryNext:
        'Press evenly through the whole foot (big toe, little toe, heel) and think “hips between your heels” at the bottom.',
      confidence,
      confidenceNote: confidenceNote(confidence),
    }
  }

  return {
    issue: 'Symmetry',
    observed:
      shift !== null
        ? `Hip center drifted slightly off midline at the bottom (about ${(shift * 100).toFixed(0)}% of frame width).`
        : 'Hip position at the bottom was not clear on every rep.',
    whyItMatters:
      'Side-to-side hip position reflects how centered you are over your base. An off-center pattern appears as a side-to-side difference in this set.',
    tryNext:
      'Set your feet, then sit straight down without leaning toward one leg.',
    ...claimGated(shift !== null, confidence),
  }
}

const BUILDERS: Record<
  FeedbackIssueKey,
  (metrics: SetMetricsSummary, confidence: ConfidenceLevel) => BiomechanicalCue
> = {
  depth: buildDepthCue,
  trunkControl: buildTrunkCue,
  kneeTracking: buildKneeTrackingCue,
  consistency: buildConsistencyCue,
  symmetry: buildSymmetryCue,
}

export function buildBiomechanicalCue(
  key: FeedbackIssueKey,
  metrics: SetMetricsSummary,
  confidence: ConfidenceLevel,
): BiomechanicalCue {
  return BUILDERS[key](metrics, confidence)
}

export function lowestComponents(
  components: ComponentScores,
  maxCues: number,
): FeedbackIssueKey[] {
  const order: FeedbackIssueKey[] = [
    'depth',
    'trunkControl',
    'kneeTracking',
    'consistency',
    'symmetry',
  ]
  return [...order]
    .sort((a, b) => components[a] - components[b])
    .slice(0, maxCues)
}
