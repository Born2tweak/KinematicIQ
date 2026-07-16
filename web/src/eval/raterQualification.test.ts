import { describe, expect, it } from 'vitest'
import { createEventLabelDraft, FORWARD_LUNGE_EVENTS, freezeEventLabelSet, setEventMark, type EventLabelSet } from './eventLabels'
import { buildRaterQualificationReport, type QualificationCase } from './raterQualification'

const source = { mediaFile: 'fixture.mp4', sha256: 'a'.repeat(64), fps: 30, frameCount: 300 }
async function labels(id: string, rater: string, offset = 0, leadSide: 'left' | 'right' = 'left'): Promise<EventLabelSet> {
  let item = createEventLabelDraft({ id, source, raterKey: rater })
  FORWARD_LUNGE_EVENTS.forEach((event, index) => { item = setEventMark(item, event, index * 10 + offset) })
  item = { ...item, leadSide, completeness: 'complete' }
  return freezeEventLabelSet(item)
}
const thresholds = { version: 'rat-v1', signedBy: ['biomechanics-owner', 'rater-coordinator', 'statistics-owner'], minimumCategoryAgreement: 0.9, minimumLeadSideAgreement: 0.9, minimumEventsWithinTolerance: 0.9, eventToleranceMs: 40 }

describe('rater qualification', () => {
  it('computes pre-adjudication agreement but blocks synthetic qualification', async () => {
    const item: QualificationCase = { caseId: 'case-1', subjectKey: 'subject-1', packetId: 'packet-1', realDevelopment: false, raterA: await labels('labels-a', 'rater-a'), raterB: await labels('labels-b', 'rater-b', 1) }
    const report = await buildRaterQualificationReport([item], thresholds)
    expect(report.eventsCompared).toBe(8)
    expect(report.eventsWithinTolerance).toBe(1)
    expect(report.disposition).toBe('blocked')
  })
  it('passes only real fixtures meeting signed rules and preserves failures', async () => {
    const item: QualificationCase = { caseId: 'case-1', subjectKey: 'subject-1', packetId: 'packet-1', realDevelopment: true, raterA: await labels('labels-a', 'rater-a'), raterB: await labels('labels-b', 'rater-b') }
    expect((await buildRaterQualificationReport([item], thresholds)).disposition).toBe('pass')
    const inverted = { ...item, raterB: await labels('labels-c', 'rater-b', 0, 'right') }
    expect((await buildRaterQualificationReport([inverted], thresholds)).disposition).toBe('fail')
  })
  it('rejects subject reuse across packets', async () => {
    const base: QualificationCase = { caseId: 'case-1', subjectKey: 'subject-1', packetId: 'packet-1', realDevelopment: true, raterA: await labels('labels-a', 'rater-a'), raterB: await labels('labels-b', 'rater-b') }
    await expect(buildRaterQualificationReport([base, { ...base, caseId: 'case-2', packetId: 'packet-2' }], thresholds)).rejects.toThrow('crosses')
  })
})
