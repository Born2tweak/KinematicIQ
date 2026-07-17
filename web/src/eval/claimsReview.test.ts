import { describe, expect, it } from 'vitest'
import { buildClaimsReview, lintForwardLungeClaim, type ClaimProposal, type ClaimsReviewer } from './claimsReview'

const proposal = (overrides: Partial<ClaimProposal> = {}): ClaimProposal => ({ id: 'count-copy', metricId: 'trial-count', findingId: null, text: 'Experimental complete-trial count within the frozen side-view setup; abstain when capture is invalid.', evidenceIds: ['alg-count-exact'], evidenceDisposition: 'pass', proposedDisposition: 'approve-internal', ...overrides })
const reviewers: ClaimsReviewer[] = (['biomechanics', 'claims-safety', 'evidence'] as const).map(role => ({ role, reviewerKey: `${role}-reviewer`, qualifications: 'Role-appropriate reviewer fixture.', conflicts: 'No conflict declared in fixture.', signedAt: '2026-07-16T00:00:00Z' }))

describe('Phase 4 claims review', () => {
  it('approves only fully evidenced, bounded, independently signed copy', async () => { const report = await buildClaimsReview('claims-v1', [proposal()], reviewers); expect(report.disposition).toBe('approved'); expect(report.copySha256).toHaveLength(64); expect(report.rows[0].effectiveDisposition).toBe('approve-internal') })
  it('suppresses blocked evidence and forbidden or unbounded language', async () => { const unsafe = proposal({ text: 'Proves normal joint health and low injury risk.', evidenceDisposition: 'blocked', proposedDisposition: 'approve-bounded-copy' }); expect(lintForwardLungeClaim(unsafe).length).toBeGreaterThan(1); const report = await buildClaimsReview('claims-v1', [unsafe], []); expect(report.disposition).toBe('blocked'); expect(report.rows[0].effectiveDisposition).toBe('suppress') })
  it('requires evidence links and all three reviewers', async () => { const report = await buildClaimsReview('claims-v1', [proposal()], reviewers.slice(0, 2)); expect(report.blockers.join(' ')).toContain('evidence'); expect(lintForwardLungeClaim(proposal({ evidenceIds: [] }))).toContain('Every claim requires safe evidence IDs.') })
})
