import { sha256Json } from './perturbations'

export const EVENT_LABEL_SCHEMA_VERSION = 'forward-lunge-event-labels-v1' as const
export const FORWARD_LUNGE_EVENTS = ['standingAnchor', 'stepInitiation', 'visiblePlant', 'descentOnset', 'bottom', 'ascentOnset', 'returnInitiation', 'stableReturn'] as const
export type ForwardLungeEvent = typeof FORWARD_LUNGE_EVENTS[number]

export interface EventMark { frameIndex: number | null; timestampMs: number | null; missingReason?: string }
export interface EventLabelSource { mediaFile: string; sha256: string; fps: number; frameCount: number; frameTimestampsMs?: number[] }
export interface EventLabelSet {
  schemaVersion: typeof EVENT_LABEL_SCHEMA_VERSION
  id: string
  protocolId: 'forwardLungeStrideReturn'
  observationProtocolId: 'side-view-forward-lunge-stride-return-v1'
  source: EventLabelSource
  raterKey: string
  blinded: true
  status: 'draft' | 'frozen' | 'adjudication'
  leadSide: 'left' | 'right' | null
  completeness: 'complete' | 'partial' | 'excluded' | null
  exclusionReason: string | null
  flags: { occlusion: boolean; crop: boolean; ambiguity: boolean }
  notes: string
  events: Record<ForwardLungeEvent, EventMark>
  parents: Array<{ id: string; sha256: string }>
  audit: Array<{ at: string; action: string; detail: string }>
  frozenAt?: string
  sha256?: string
}

const SHA256 = /^[a-f0-9]{64}$/
const SAFE = /^[a-z0-9][a-z0-9_-]*$/i
const now = () => new Date().toISOString()

export function frameToTimestampMs(source: EventLabelSource, frameIndex: number): number {
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= source.frameCount) throw new Error(`Frame ${frameIndex} is outside 0..${source.frameCount - 1}.`)
  return source.frameTimestampsMs?.[frameIndex] ?? frameIndex * 1000 / source.fps
}

export function timestampToFrame(source: EventLabelSource, timestampMs: number): number {
  if (!Number.isFinite(timestampMs) || timestampMs < 0) throw new Error('Timestamp must be finite and non-negative.')
  if (source.frameTimestampsMs) return source.frameTimestampsMs.reduce((best, value, index) => Math.abs(value - timestampMs) < Math.abs(source.frameTimestampsMs![best] - timestampMs) ? index : best, 0)
  return Math.min(source.frameCount - 1, Math.round(timestampMs * source.fps / 1000))
}

export function createEventLabelDraft(input: { id: string; source: EventLabelSource; raterKey: string }): EventLabelSet {
  const events = Object.fromEntries(FORWARD_LUNGE_EVENTS.map(event => [event, { frameIndex: null, timestampMs: null, missingReason: 'not-yet-labeled' }])) as Record<ForwardLungeEvent, EventMark>
  return validateEventLabelSet({ schemaVersion: EVENT_LABEL_SCHEMA_VERSION, id: input.id, protocolId: 'forwardLungeStrideReturn', observationProtocolId: 'side-view-forward-lunge-stride-return-v1', source: input.source, raterKey: input.raterKey, blinded: true, status: 'draft', leadSide: null, completeness: null, exclusionReason: null, flags: { occlusion: false, crop: false, ambiguity: false }, notes: '', events, parents: [], audit: [{ at: now(), action: 'create', detail: 'Blinded draft created.' }] })
}

export function validateEventLabelSet(value: EventLabelSet, expectedSourceSha256?: string): EventLabelSet {
  if (value.schemaVersion !== EVENT_LABEL_SCHEMA_VERSION || value.protocolId !== 'forwardLungeStrideReturn' || value.observationProtocolId !== 'side-view-forward-lunge-stride-return-v1') throw new Error('Unsupported event-label identity or schema.')
  if (!SAFE.test(value.id) || !SAFE.test(value.raterKey)) throw new Error('Label and rater IDs must be pseudonymous safe keys.')
  if (!value.blinded) throw new Error('Event labels must remain blinded to KinematicIQ output.')
  if (!SHA256.test(value.source.sha256) || (expectedSourceSha256 && value.source.sha256 !== expectedSourceSha256)) throw new Error('Source checksum mismatch.')
  if (!(value.source.fps > 0) || !Number.isInteger(value.source.frameCount) || value.source.frameCount < 1) throw new Error('Source FPS/frame count are invalid.')
  if (value.source.frameTimestampsMs && (value.source.frameTimestampsMs.length !== value.source.frameCount || value.source.frameTimestampsMs.some((time, index, all) => !Number.isFinite(time) || (index > 0 && time <= all[index - 1])))) throw new Error('Variable-FPS timestamps must be complete and strictly increasing.')
  let previous = -1
  for (const event of FORWARD_LUNGE_EVENTS) {
    const mark = value.events[event]
    if (!mark) throw new Error(`Missing required event field ${event}.`)
    if (mark.frameIndex === null) {
      if (mark.timestampMs !== null || !mark.missingReason?.trim()) throw new Error(`Null event ${event} requires an explicit missing reason and null timestamp.`)
      continue
    }
    const expected = frameToTimestampMs(value.source, mark.frameIndex)
    if (mark.timestampMs === null || Math.abs(mark.timestampMs - expected) > 1e-6) throw new Error(`Frame/time mismatch for ${event}.`)
    if (mark.frameIndex < previous) throw new Error(`Impossible event ordering at ${event}.`)
    previous = mark.frameIndex
  }
  if (value.status === 'frozen' && (!value.frozenAt || !SHA256.test(value.sha256 ?? ''))) throw new Error('Frozen label sets require timestamp and checksum.')
  if (value.status === 'adjudication' && value.parents.length !== 2) throw new Error('Adjudication must link exactly two frozen raw records.')
  return value
}

function editable(labelSet: EventLabelSet): void {
  if (labelSet.status === 'frozen') throw new Error('Frozen label records are immutable.')
}

export function setEventMark(labelSet: EventLabelSet, event: ForwardLungeEvent, frameIndex: number | null, missingReason?: string): EventLabelSet {
  editable(labelSet)
  if (!FORWARD_LUNGE_EVENTS.includes(event)) throw new Error(`Unknown event ${event}.`)
  const mark: EventMark = frameIndex === null ? { frameIndex: null, timestampMs: null, missingReason: missingReason?.trim() || 'not-visible' } : { frameIndex, timestampMs: frameToTimestampMs(labelSet.source, frameIndex) }
  const next = { ...labelSet, events: { ...labelSet.events, [event]: mark }, audit: [...labelSet.audit, { at: now(), action: 'set-event', detail: `${event}=${frameIndex ?? 'null'}` }] }
  return validateEventLabelSet(next)
}

export async function freezeEventLabelSet(labelSet: EventLabelSet): Promise<EventLabelSet> {
  editable(labelSet)
  const frozenAt = now()
  const withoutChecksum: EventLabelSet = { ...labelSet, status: 'frozen', frozenAt, sha256: undefined, audit: [...labelSet.audit, { at: frozenAt, action: 'freeze', detail: 'Raw rater opinion frozen.' }] }
  const frozen = { ...withoutChecksum, sha256: await sha256Json(withoutChecksum) }
  return validateEventLabelSet(frozen)
}

export async function verifyFrozenLabelSetChecksum(labelSet: EventLabelSet): Promise<EventLabelSet> {
  validateEventLabelSet(labelSet)
  if (labelSet.status !== 'frozen') return labelSet
  const { sha256, ...content } = labelSet
  if (await sha256Json(content) !== sha256) throw new Error('Frozen label-set checksum mismatch.')
  return labelSet
}

export function compareFrozenLabelSets(left: EventLabelSet, right: EventLabelSet): Record<ForwardLungeEvent, number | null> {
  if (left.status !== 'frozen' || right.status !== 'frozen') throw new Error('Compare mode is available only after both records freeze.')
  if (left.source.sha256 !== right.source.sha256) throw new Error('Cannot compare labels for different source media.')
  return Object.fromEntries(FORWARD_LUNGE_EVENTS.map(event => {
    const a = left.events[event].frameIndex
    const b = right.events[event].frameIndex
    return [event, a === null || b === null ? null : b - a]
  })) as Record<ForwardLungeEvent, number | null>
}

export async function createAdjudication(left: EventLabelSet, right: EventLabelSet, id: string, raterKey: string): Promise<EventLabelSet> {
  compareFrozenLabelSets(left, right)
  const events = Object.fromEntries(FORWARD_LUNGE_EVENTS.map(event => {
    const a = left.events[event]
    const b = right.events[event]
    return [event, a.frameIndex === b.frameIndex ? { ...a } : { frameIndex: null, timestampMs: null, missingReason: 'requires-adjudication' }]
  })) as Record<ForwardLungeEvent, EventMark>
  const at = now()
  const record: EventLabelSet = { ...createEventLabelDraft({ id, source: left.source, raterKey }), status: 'adjudication', events, parents: [{ id: left.id, sha256: left.sha256! }, { id: right.id, sha256: right.sha256! }], audit: [{ at, action: 'adjudicate', detail: 'Third record created; raw opinions preserved.' }] }
  return validateEventLabelSet(record)
}

export function parseEventLabelSet(json: string, expectedSourceSha256?: string): EventLabelSet {
  const parsed = JSON.parse(json) as EventLabelSet
  const forbidden = /"(?:kinematiciq|fmsScore|modelPrediction|automatedPrelabel)"\s*:/i
  if (forbidden.test(json)) throw new Error('Blinded label files cannot contain model/product outputs or automated prelabels.')
  return validateEventLabelSet(parsed, expectedSourceSha256)
}
