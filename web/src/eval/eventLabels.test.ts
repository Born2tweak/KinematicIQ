import { describe, expect, it } from 'vitest'
import { compareFrozenLabelSets, createAdjudication, createEventLabelDraft, FORWARD_LUNGE_EVENTS, frameToTimestampMs, freezeEventLabelSet, parseEventLabelSet, setEventMark, timestampToFrame, verifyFrozenLabelSetChecksum } from './eventLabels'

const source = { mediaFile: 'fixture.mp4', sha256: 'a'.repeat(64), fps: 29.97, frameCount: 300 }
const complete = (id: string, raterKey: string) => FORWARD_LUNGE_EVENTS.reduce((draft, event, index) => setEventMark(draft, event, index * 10), createEventLabelDraft({ id, source, raterKey }))

describe('independent forward-lunge event labels', () => {
  it('maps constant and variable FPS exactly and round-trips explicit nulls', () => {
    expect(timestampToFrame(source, frameToTimestampMs(source, 17))).toBe(17)
    const variable = { ...source, fps: 30, frameCount: 3, frameTimestampsMs: [0, 31, 70] }
    expect(frameToTimestampMs(variable, 2)).toBe(70)
    expect(timestampToFrame(variable, 45)).toBe(1)
    const draft = setEventMark(createEventLabelDraft({ id: 'labels-1', source, raterKey: 'rater-1' }), 'bottom', null, 'occluded')
    expect(parseEventLabelSet(JSON.stringify(draft)).events.bottom.missingReason).toBe('occluded')
  })

  it('fails closed on ordering, checksum mismatch, and blinded-output leakage', () => {
    let draft = createEventLabelDraft({ id: 'labels-1', source, raterKey: 'rater-1' })
    draft = setEventMark(draft, 'standingAnchor', 20)
    expect(() => setEventMark(draft, 'stepInitiation', 10)).toThrow('ordering')
    expect(() => parseEventLabelSet(JSON.stringify(draft), 'b'.repeat(64))).toThrow('checksum')
    expect(() => parseEventLabelSet(JSON.stringify({ ...draft, modelPrediction: {} }))).toThrow('Blinded')
  })

  it('freezes immutable raw opinions, gates compare, and creates a linked third adjudication record', async () => {
    const left = await freezeEventLabelSet(complete('left-labels', 'rater-1'))
    const right = await freezeEventLabelSet(complete('right-labels', 'rater-2'))
    expect(left.sha256).toHaveLength(64)
    expect(() => setEventMark(left, 'bottom', 50)).toThrow('immutable')
    await expect(verifyFrozenLabelSetChecksum({ ...left, notes: 'tampered' })).rejects.toThrow('checksum')
    expect(compareFrozenLabelSets(left, right).bottom).toBe(0)
    expect(() => compareFrozenLabelSets(left, complete('draft-labels', 'rater-3'))).toThrow('only after')
    const adjudication = await createAdjudication(left, right, 'adjudication-1', 'rater-3')
    expect(adjudication.status).toBe('adjudication')
    expect(adjudication.parents).toHaveLength(2)
    expect(setEventMark(adjudication, 'bottom', 40).events.bottom.frameIndex).toBe(40)
  })
})
