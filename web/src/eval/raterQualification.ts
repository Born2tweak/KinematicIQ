import { FORWARD_LUNGE_EVENTS, verifyFrozenLabelSetChecksum, type EventLabelSet } from './eventLabels'

export interface QualificationThresholds {
  version: string
  signedBy: string[]
  minimumCategoryAgreement: number
  minimumLeadSideAgreement: number
  minimumEventsWithinTolerance: number
  eventToleranceMs: number
}

export interface QualificationCase {
  caseId: string
  subjectKey: string
  packetId: string
  realDevelopment: boolean
  raterA: EventLabelSet
  raterB: EventLabelSet
}

export interface RaterQualificationReport {
  schemaVersion: 1
  cases: number
  subjects: number
  packets: string[]
  categoryAgreement: number
  leadSideAgreement: number
  eventsCompared: number
  eventsWithinTolerance: number
  medianAbsoluteEventErrorMs: number | null
  p95AbsoluteEventErrorMs: number | null
  omittedAttempts: number
  criticalSideInversions: number
  criteriaVersion: string
  disposition: 'pass' | 'fail' | 'blocked'
  blockers: string[]
}

const KEY = /^[a-z0-9][a-z0-9_-]*$/i
const quantile = (values: number[], q: number) => values.length ? [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor((values.length - 1) * q))] : null

export async function buildRaterQualificationReport(cases: readonly QualificationCase[], thresholds: QualificationThresholds): Promise<RaterQualificationReport> {
  if (cases.length === 0) throw new Error('Rater qualification requires cases.')
  if (!KEY.test(thresholds.version) || thresholds.signedBy.length < 3 || thresholds.signedBy.some(key => !KEY.test(key))) throw new Error('Qualification criteria require a version and three pseudonymous human signers.')
  if (thresholds.eventToleranceMs < 0 || [thresholds.minimumCategoryAgreement, thresholds.minimumLeadSideAgreement, thresholds.minimumEventsWithinTolerance].some(value => value < 0 || value > 1)) throw new Error('Qualification thresholds are invalid.')
  const caseIds = new Set<string>()
  const subjectPackets = new Map<string, string>()
  const errors: number[] = []
  let categoryMatches = 0, sideMatches = 0, omittedAttempts = 0, criticalSideInversions = 0
  for (const item of cases) {
    if (!KEY.test(item.caseId) || !KEY.test(item.subjectKey) || !KEY.test(item.packetId) || caseIds.has(item.caseId)) throw new Error('Qualification case identifiers must be unique and safe.')
    caseIds.add(item.caseId)
    const priorPacket = subjectPackets.get(item.subjectKey)
    if (priorPacket && priorPacket !== item.packetId) throw new Error(`Subject ${item.subjectKey} crosses qualification packets.`)
    subjectPackets.set(item.subjectKey, item.packetId)
    await verifyFrozenLabelSetChecksum(item.raterA); await verifyFrozenLabelSetChecksum(item.raterB)
    if (item.raterA.source.sha256 !== item.raterB.source.sha256) throw new Error('Qualification pair source checksum mismatch.')
    categoryMatches += Number(item.raterA.completeness === item.raterB.completeness)
    sideMatches += Number(item.raterA.leadSide === item.raterB.leadSide)
    criticalSideInversions += Number(item.raterA.leadSide !== null && item.raterB.leadSide !== null && item.raterA.leadSide !== item.raterB.leadSide)
    for (const event of FORWARD_LUNGE_EVENTS) {
      const a = item.raterA.events[event].timestampMs, b = item.raterB.events[event].timestampMs
      if (a === null || b === null) { if (a !== b) omittedAttempts++; continue }
      errors.push(Math.abs(a - b))
    }
  }
  const categoryAgreement = categoryMatches / cases.length
  const leadSideAgreement = sideMatches / cases.length
  const within = errors.filter(value => value <= thresholds.eventToleranceMs).length
  const eventsWithinTolerance = errors.length ? within / errors.length : 0
  const blockers = cases.every(item => item.realDevelopment) ? [] : ['Qualification requires approved real development recordings; synthetic fixtures cannot qualify raters.']
  const passed = categoryAgreement >= thresholds.minimumCategoryAgreement && leadSideAgreement >= thresholds.minimumLeadSideAgreement && eventsWithinTolerance >= thresholds.minimumEventsWithinTolerance && omittedAttempts === 0 && criticalSideInversions === 0
  return { schemaVersion: 1, cases: cases.length, subjects: subjectPackets.size, packets: [...new Set(cases.map(item => item.packetId))].sort(), categoryAgreement, leadSideAgreement, eventsCompared: errors.length, eventsWithinTolerance, medianAbsoluteEventErrorMs: quantile(errors, 0.5), p95AbsoluteEventErrorMs: quantile(errors, 0.95), omittedAttempts, criticalSideInversions, criteriaVersion: thresholds.version, disposition: blockers.length ? 'blocked' : passed ? 'pass' : 'fail', blockers }
}
