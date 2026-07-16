import { CONFIDENCE_THRESHOLD, LANDMARK_INDICES, type PoseFrame } from '../cv/types'
import { createLiveStreamFilter, LIVE_ONE_EURO } from '../cv/landmarkFilter'
import { makeProvenance } from '../core/provenance'
import { analyzeInlineLungeResearch } from '../protocols/inlineLunge'
import type { InlineLungeSide } from '../protocols/inlineLunge/types'

export interface LungeDiagnosticInput {
  sequenceId: string
  sourceSha256: string
  transformationId: string
  perturbationVersion: string
  leadSide: InlineLungeSide
  frames: readonly PoseFrame[]
}

type Summary = { count: number; median: number | null; p95: number | null; max: number | null }
export interface LungeTemporalDiagnosticRow {
  sequenceId: string
  sourceSha256: string
  transformationId: string
  frameCount: number
  timestamp: { nonPositiveIntervals: number; effectiveFps: number | null; intervalsMs: Summary }
  landmarks: Array<{ index: number; readableFrames: number; missingFrames: number; readableRuns: Summary; dropoutRuns: Summary; maxVelocity: number | null; maxAcceleration: number | null }>
  sideContinuityFlips: number
  raw: { filter: 'raw'; completedTrials: number; eventFrames: number[] }
  oneEuro: { filter: 'one-euro-live'; version: typeof LIVE_ONE_EURO; completedTrials: number; eventFrames: number[]; meanCoordinateLag: number | null }
  sensitivity: { countDelta: number; perturbationCountDelta: number; pairedBottomFrameDeltas: number[] }
  missingnessByPhase: Record<string, number>
  phasePersistenceFrames: Summary
}

export interface LungeTemporalBaseline {
  schemaVersion: 1
  evaluator: { id: 'forward-lunge-temporal-diagnostics'; version: '1.0.0'; algorithmVersion: string; perturbationVersions: string[] }
  denominators: { sequences: number; frames: number; landmarks: number }
  aggregate: { missingFrames: Summary; countDeltas: Summary; bottomEventDeltas: Summary; worstCases: Array<{ sequenceId: string; score: number }> }
  rows: LungeTemporalDiagnosticRow[]
  limitations: string[]
}

function summary(values: readonly number[]): Summary {
  if (values.length === 0) return { count: 0, median: null, p95: null, max: null }
  const sorted = [...values].sort((a, b) => a - b)
  const at = (fraction: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))]
  return { count: values.length, median: at(0.5), p95: at(0.95), max: sorted[sorted.length - 1] }
}

function runs(values: readonly boolean[], match: boolean): number[] {
  const output: number[] = []
  let length = 0
  for (const value of values) {
    if (value === match) length++
    else if (length) { output.push(length); length = 0 }
  }
  if (length) output.push(length)
  return output
}

function kinematics(frames: readonly PoseFrame[], landmarkIndex: number): { maxVelocity: number | null; maxAcceleration: number | null } {
  const velocities: number[] = []
  for (let index = 1; index < frames.length; index++) {
    const dt = (frames[index].timestamp - frames[index - 1].timestamp) / 1000
    const a = frames[index - 1].landmarks[landmarkIndex]
    const b = frames[index].landmarks[landmarkIndex]
    if (!(dt > 0) || !a || !b) continue
    velocities.push(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / dt)
  }
  const accelerations = velocities.slice(1).map((velocity, index) => Math.abs(velocity - velocities[index]))
  return { maxVelocity: velocities.length ? Math.max(...velocities) : null, maxAcceleration: accelerations.length ? Math.max(...accelerations) : null }
}

function diagnose(input: LungeDiagnosticInput): LungeTemporalDiagnosticRow {
  const frames = input.frames
  const intervals = frames.slice(1).map((frame, index) => frame.timestamp - frames[index].timestamp)
  const validIntervals = intervals.filter(value => value > 0)
  const landmarkCount = frames[0]?.landmarks.length ?? 0
  const landmarks = Array.from({ length: landmarkCount }, (_, index) => {
    const readable = frames.map(frame => (frame.landmarks[index]?.visibility ?? 0) >= CONFIDENCE_THRESHOLD)
    const motion = kinematics(frames, index)
    return { index, readableFrames: readable.filter(Boolean).length, missingFrames: readable.filter(value => !value).length, readableRuns: summary(runs(readable, true)), dropoutRuns: summary(runs(readable, false)), ...motion }
  })
  const lead = input.leadSide === 'left' ? LANDMARK_INDICES.LEFT_ANKLE : LANDMARK_INDICES.RIGHT_ANKLE
  const other = input.leadSide === 'left' ? LANDMARK_INDICES.RIGHT_ANKLE : LANDMARK_INDICES.LEFT_ANKLE
  const ordering = frames.map(frame => Math.sign((frame.landmarks[lead]?.x ?? 0) - (frame.landmarks[other]?.x ?? 0)))
  const sideContinuityFlips = ordering.slice(1).filter((value, index) => value !== 0 && ordering[index] !== 0 && value !== ordering[index]).length
  const filter = createLiveStreamFilter()
  const filtered = frames.map(frame => filter.filter(frame))
  const provenance = makeProvenance({ captureSource: 'synthetic', protocolId: 'side-view-forward-lunge-stride-return-v1' })
  const rawResult = analyzeInlineLungeResearch(frames, { leadSide: input.leadSide, provenance })
  const filteredResult = analyzeInlineLungeResearch(filtered, { leadSide: input.leadSide, provenance: { ...provenance, filterVariant: 'one-euro-live' } })
  const rawTrials = rawResult.trials.filter(trial => trial.status === 'completed')
  const filteredTrials = filteredResult.trials.filter(trial => trial.status === 'completed')
  const eventFrames = (trials: typeof rawTrials) => trials.flatMap(trial => [trial.stepInitiationFrame, trial.descentStartFrame, trial.bottomFrame, trial.ascentStartFrame, trial.stableReturnFrame])
  const lagValues = frames.flatMap((frame, frameIndex) => frame.landmarks.map((point, index) => Math.hypot(point.x - filtered[frameIndex].landmarks[index].x, point.y - filtered[frameIndex].landmarks[index].y)))
  const pairedBottomFrameDeltas = rawTrials.slice(0, filteredTrials.length).map((trial, index) => filteredTrials[index].bottomFrame - trial.bottomFrame)
  const missingnessByPhase: Record<string, number> = { standing: 0, stepping: 0, descending: 0, bottom: 0, ascending: 0, returning: 0 }
  const phaseLengths: number[] = []
  rawTrials.forEach(trial => {
    const boundaries = [trial.standingStartFrame, trial.stepInitiationFrame, trial.descentStartFrame, trial.bottomFrame, trial.ascentStartFrame, trial.stableReturnFrame]
    Object.keys(missingnessByPhase).forEach((phase, index) => {
      const end = index + 1 < boundaries.length ? boundaries[index + 1] : trial.stableReturnFrame + 1
      phaseLengths.push(Math.max(0, end - boundaries[index]))
      missingnessByPhase[phase] += frames.slice(boundaries[index], end).filter(frame => frame.landmarks.some(point => point.visibility < CONFIDENCE_THRESHOLD)).length
    })
  })
  return {
    sequenceId: input.sequenceId, sourceSha256: input.sourceSha256, transformationId: input.transformationId, frameCount: frames.length,
    timestamp: { nonPositiveIntervals: intervals.filter(value => value <= 0).length, effectiveFps: validIntervals.length ? 1000 / (validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length) : null, intervalsMs: summary(validIntervals) },
    landmarks, sideContinuityFlips,
    raw: { filter: 'raw', completedTrials: rawTrials.length, eventFrames: eventFrames(rawTrials) },
    oneEuro: { filter: 'one-euro-live', version: LIVE_ONE_EURO, completedTrials: filteredTrials.length, eventFrames: eventFrames(filteredTrials), meanCoordinateLag: lagValues.length ? lagValues.reduce((a, b) => a + b, 0) / lagValues.length : null },
    sensitivity: { countDelta: filteredTrials.length - rawTrials.length, perturbationCountDelta: 0, pairedBottomFrameDeltas }, missingnessByPhase, phasePersistenceFrames: summary(phaseLengths),
  }
}

export function buildLungeTemporalBaseline(inputs: readonly LungeDiagnosticInput[]): LungeTemporalBaseline {
  if (inputs.length === 0) throw new Error('Temporal diagnostic baseline requires at least one sequence.')
  const rows = inputs.map(diagnose)
  const identityCount = rows.find(row => row.transformationId === 'identity')?.raw.completedTrials
  if (identityCount !== undefined) rows.forEach(row => { row.sensitivity.perturbationCountDelta = row.raw.completedTrials - identityCount })
  const missing = rows.flatMap(row => row.landmarks.map(item => item.missingFrames))
  const countDeltas = rows.flatMap(row => [Math.abs(row.sensitivity.countDelta), Math.abs(row.sensitivity.perturbationCountDelta)])
  const bottomDeltas = rows.flatMap(row => row.sensitivity.pairedBottomFrameDeltas.map(Math.abs))
  return {
    schemaVersion: 1,
    evaluator: { id: 'forward-lunge-temporal-diagnostics', version: '1.0.0', algorithmVersion: 'forward-lunge-stride-return-v1', perturbationVersions: [...new Set(inputs.map(input => input.perturbationVersion))].sort() },
    denominators: { sequences: rows.length, frames: rows.reduce((sum, row) => sum + row.frameCount, 0), landmarks: rows.reduce((sum, row) => sum + row.landmarks.length, 0) },
    aggregate: { missingFrames: summary(missing), countDeltas: summary(countDeltas), bottomEventDeltas: summary(bottomDeltas), worstCases: rows.map(row => ({ sequenceId: row.sequenceId, score: (Math.abs(row.sensitivity.countDelta) + Math.abs(row.sensitivity.perturbationCountDelta)) * 1000 + row.landmarks.reduce((sum, item) => sum + item.missingFrames, 0) })).sort((a, b) => b.score - a.score) },
    rows,
    limitations: ['Synthetic and repository fixtures are engineering diagnostics, not population validation.', 'No filter, threshold, recovery, protocol availability, or product output is selected or changed by this report.'],
  }
}
