/**
 * Root-cause concept cards (M22) — MD04 §5 made honest.
 *
 * Each card names a POSSIBLE contributor to the movement observations in
 * this set, with the findings and metric reads that make it plausible.
 * Plausibility language only: cards never diagnose, never mention injury
 * or pathology, and always carry the check-it-yourself framing. Cards
 * render only for a valid set at the expert disclosure tier.
 */
import type { Finding, FindingProvenance } from '../core/finding'
import type { MetricResult } from '../core/metric'
import type { SetMetricsSummary } from '../session/types'

export interface RootCauseCard {
  id: string
  title: string
  /** Why this candidate is plausible for THIS set, observation language. */
  plausibleBecause: string
  /** Finding ids that triggered the card. */
  linkedFindingIds: string[]
  /** How the athlete can check it themselves — never a prescription. */
  selfCheck: string
  /** Fixed honesty line rendered with every card. */
  framing: string
  /** Rule provenance (M50) — root-cause cards are heuristic BY DESIGN. */
  provenance: FindingProvenance
}

/**
 * Every root-cause card carries `heuristic` status permanently: the cards
 * name possible contributors, and no test can promote a plausibility rule
 * past heuristic without a validation study the doctrine does not yet allow
 * us to claim.
 */
function rootCauseProvenance(cardId: string): FindingProvenance {
  return {
    ruleId: `rule.${cardId}`,
    sourceDocs: [
      'docs/research/04_Coaching_Intelligence_Engine_Spec.md',
      'docs/doctrine/claims-policy.md',
    ],
    reviewStatus: 'heuristic',
    lastReviewed: '2026-07-07',
  }
}

export const ROOT_CAUSE_FRAMING =
  'A possible contributor, not a diagnosis — the camera sees the pattern, not the reason.'

const DEEP_ANKLE_PROXY_LIMIT = 115
const DEEP_HIP_PROXY_LIMIT = 100

interface RuleContext {
  findingIds: Set<string>
  metrics: SetMetricsSummary
  metricResults: readonly MetricResult[]
}

function metricValue(ctx: RuleContext, id: string): number | null {
  const r = ctx.metricResults.find((m) => m.metricId === id)
  return r?.value ?? null
}

type CardRule = (ctx: RuleContext) => RootCauseCard | null

const RULES: CardRule[] = [
  // Limited ankle mobility: depth-limited with a shallow ankle proxy read.
  (ctx) => {
    if (!ctx.findingIds.has('squat.depth')) return null
    const ankle = metricValue(ctx, 'squat.rom.ankle-dorsiflexion')
    if (ankle === null || ankle < DEEP_ANKLE_PROXY_LIMIT) return null
    return {
      id: 'root.ankle-mobility',
      title: 'Limited ankle mobility',
      plausibleBecause: `Depth was flagged in this set while the ankle read stayed around ${Math.round(ankle)}° — squats often stop where the ankles stop.`,
      linkedFindingIds: ['squat.depth'],
      selfCheck:
        'Try a knee-to-wall test: with your toes ~10 cm from a wall, can each knee touch it with the heel down? A clear side difference or a short reach fits this pattern.',
      framing: ROOT_CAUSE_FRAMING,
      provenance: rootCauseProvenance('root.ankle-mobility'),
    }
  },
  // Hip mobility / hip strategy: depth-limited with limited hip flexion.
  (ctx) => {
    if (!ctx.findingIds.has('squat.depth')) return null
    const hip = metricValue(ctx, 'squat.rom.hip-flexion')
    if (hip === null || hip < DEEP_HIP_PROXY_LIMIT) return null
    return {
      id: 'root.hip-mobility',
      title: 'Hip mobility or hip strategy',
      plausibleBecause: `Depth was flagged while the hip-flexion read stayed around ${Math.round(hip)}° — the hips may not be folding far enough to sit lower.`,
      linkedFindingIds: ['squat.depth'],
      selfCheck:
        'Try a deep bodyweight squat holding onto a doorframe. If depth comes easily with support, positioning and balance are more likely than mobility.',
      framing: ROOT_CAUSE_FRAMING,
      provenance: rootCauseProvenance('root.hip-mobility'),
    }
  },
  // Trunk-control: the trunk finding itself.
  (ctx) => {
    if (!ctx.findingIds.has('squat.trunkControl')) return null
    return {
      id: 'root.trunk-control',
      title: 'Trunk control',
      plausibleBecause:
        'Chest lean was flagged in this set — a trunk that tips or varies rep to rep often reads as bracing that changes mid-set.',
      linkedFindingIds: ['squat.trunkControl'],
      selfCheck:
        'Film one set with a deliberate breath-and-brace before each rep. If the lean steadies, bracing habit fits this pattern better than strength.',
      framing: ROOT_CAUSE_FRAMING,
      provenance: rootCauseProvenance('root.trunk-control'),
    }
  },
  // Balance / coordination: lateral shift or uneven knees.
  (ctx) => {
    const triggers = ['squat.symmetry', 'squat.kneeTracking'].filter((id) =>
      ctx.findingIds.has(id),
    )
    if (triggers.length === 0) return null
    return {
      id: 'root.balance-coordination',
      title: 'Balance or side-to-side habit',
      plausibleBecause:
        'The set showed a side-to-side difference (hip shift and/or uneven knee bend) — weight drifting to one side is the most common reason.',
      linkedFindingIds: triggers,
      selfCheck:
        'Stand on each leg for 30 seconds, eyes forward. A clearly shakier side, or a stance you avoid, fits this pattern.',
      framing: ROOT_CAUSE_FRAMING,
      provenance: rootCauseProvenance('root.balance-coordination'),
    }
  },
  // Fatigue: erratic tempo alongside inconsistent depth.
  (ctx) => {
    if (!ctx.findingIds.has('squat.tempo')) return null
    if (!ctx.findingIds.has('squat.consistency') && !ctx.findingIds.has('squat.depth'))
      return null
    return {
      id: 'root.fatigue',
      title: 'Fatigue across the set',
      plausibleBecause:
        'Rep timing and depth both varied in this set — later reps slowing down or shrinking is what fatigue usually looks like on camera.',
      linkedFindingIds: ['squat.tempo'],
      selfCheck:
        'Record a shorter set (or rest longer first) and compare: if timing and depth steady out, fatigue fits this pattern.',
      framing: ROOT_CAUSE_FRAMING,
      provenance: rootCauseProvenance('root.fatigue'),
    }
  },
]

/**
 * Derive root-cause cards from a valid set's findings + metric reads.
 * Returns [] whenever there are no findings — the cards only ever explain
 * observations that were actually surfaced.
 */
export function deriveRootCauses(
  findings: readonly Finding[],
  metrics: SetMetricsSummary,
  metricResults: readonly MetricResult[],
): RootCauseCard[] {
  if (findings.length === 0) return []
  const ctx: RuleContext = {
    findingIds: new Set(findings.map((f) => f.id)),
    metrics,
    metricResults,
  }
  return RULES.map((rule) => rule(ctx)).filter(
    (card): card is RootCauseCard => card !== null,
  )
}
