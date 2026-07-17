import { sha256Json } from './perturbations'

export type ClaimDisposition = 'approve-internal' | 'approve-bounded-copy' | 'revise' | 'suppress' | 'reject'
export type EvidenceDisposition = 'pass' | 'fail' | 'inconclusive' | 'blocked'
export interface ClaimProposal { id: string; metricId: string; findingId: string | null; text: string; evidenceIds: string[]; evidenceDisposition: EvidenceDisposition; proposedDisposition: ClaimDisposition }
export interface ClaimsReviewer { role: 'biomechanics' | 'claims-safety' | 'evidence'; reviewerKey: string; qualifications: string; conflicts: string; signedAt: string | null }
export interface ClaimsReviewReport { schemaVersion: 1; version: string; rows: Array<ClaimProposal & { lintErrors: string[]; effectiveDisposition: ClaimDisposition }>; reviewers: ClaimsReviewer[]; copySha256: string; disposition: 'approved' | 'blocked'; blockers: string[] }

const KEY = /^[a-z0-9][a-z0-9_-]*$/i
const FORBIDDEN = [/(?:diagnos(?:e|is)|patholog(?:y|ical)|dysfunction|abnormal)/i, /\b(?:injury risk|injury prediction|return[- ]to[- ]play|readiness)\b/i, /\b(?:force|torque|joint load|joint stress|muscle activation|weak glutes)\b/i, /\b(?:healthy norm|normal population|FMS score)\b/i, /\b(?:clinical|medical)\b/i]

export function lintForwardLungeClaim(item: ClaimProposal): string[] {
  const errors: string[] = []
  if (!KEY.test(item.id) || !KEY.test(item.metricId) || (item.findingId !== null && !KEY.test(item.findingId))) errors.push('Claim/metric/finding identity must be safe and traceable.')
  if (!item.text.trim()) errors.push('Proposed copy is empty.')
  if (!item.evidenceIds.length || item.evidenceIds.some(id => !KEY.test(id))) errors.push('Every claim requires safe evidence IDs.')
  if (FORBIDDEN.some(pattern => pattern.test(item.text))) errors.push('Copy contains forbidden clinical, injury, kinetic, normative, or FMS language.')
  if (/\b(?:always|proves?|guarantees?|accurate|validated)\b/i.test(item.text) && !/for the frozen .* setup|within the frozen .* setup/i.test(item.text)) errors.push('Strong language lacks the frozen task/population/setup qualifier.')
  if (!/\b(?:in this set|from this capture|within the frozen|experimental|unavailable|abstain)\b/i.test(item.text)) errors.push('Copy lacks an explicit scope, uncertainty, or abstention qualifier.')
  if (['fail', 'inconclusive', 'blocked'].includes(item.evidenceDisposition) && ['approve-internal', 'approve-bounded-copy'].includes(item.proposedDisposition)) errors.push('Failed, inconclusive, or blocked evidence cannot receive approved copy.')
  return errors
}

export async function buildClaimsReview(version: string, proposals: readonly ClaimProposal[], reviewers: readonly ClaimsReviewer[]): Promise<ClaimsReviewReport> {
  if (!KEY.test(version) || !proposals.length) throw new Error('Claims review requires a version and proposed rows.')
  const ids = new Set<string>()
  const rows = proposals.map(item => {
    if (ids.has(item.id)) throw new Error(`Duplicate claim ${item.id}.`)
    ids.add(item.id)
    const lintErrors = lintForwardLungeClaim(item)
    return { ...item, lintErrors, effectiveDisposition: lintErrors.length ? (item.evidenceDisposition === 'fail' ? 'reject' : 'suppress') as ClaimDisposition : item.proposedDisposition }
  })
  const signedRoles = new Set(reviewers.filter(item => KEY.test(item.reviewerKey) && item.qualifications.trim() && item.conflicts.trim() && item.signedAt && !Number.isNaN(Date.parse(item.signedAt))).map(item => item.role))
  const blockers = (['biomechanics', 'claims-safety', 'evidence'] as const).filter(role => !signedRoles.has(role)).map(role => `Missing signed ${role} review.`)
  if (rows.some(row => row.lintErrors.length)) blockers.push('One or more proposed strings fail claims/evidence lint.')
  const copySha256 = await sha256Json(rows.map(row => ({ id: row.id, text: row.text, evidenceIds: row.evidenceIds, effectiveDisposition: row.effectiveDisposition })))
  return { schemaVersion: 1, version, rows, reviewers: [...reviewers], copySha256, disposition: blockers.length ? 'blocked' : 'approved', blockers }
}
