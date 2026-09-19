/**
 * Assumption system (plan §2.8, §13).
 *
 * A material decision rests on assumptions. Two quite different things can go
 * wrong with one, and the game must not confuse them:
 *
 *   1. The assumption was true when it was made, and the world then moved.
 *      This is the classic case: a retirement date slips, a supplier gains
 *      access, coverage decays. The lesson is that decisions rot.
 *
 *   2. The assumption was never true. The CISO believed MFA covered every
 *      administrator; it covered 62% of them. The lesson here is about
 *      assurance, not change — and crucially, the player only learns it when
 *      they go and look.
 *
 * The second case must not surface the day after it is recorded. Nothing has
 * happened, and telling the player immediately would both be absurd and leak
 * hidden state they have not earned. So a never-true assumption stays quiet
 * until the player's knowledge catches up: the relevant control is assessed,
 * or the relevant dependency is discovered. If they never look, it never fires
 * — and the annual review names it as something they relied on all year and
 * never checked.
 *
 * Rules are named predicates so invalidation stays deterministic and testable.
 */
import type { ContentIndex, GameState } from '../types'
import { calculateControlEffectiveness } from '../controls/effectiveness'

export interface RuleVerdict {
  holds: boolean
  reason?: string
}

/**
 * What the player would have to find out before a never-true assumption can
 * surface. Expressed as data so it stays inspectable and testable.
 */
export type RevealCondition =
  | { kind: 'control-assessed'; controlId: string }
  | { kind: 'edge-discovered'; edgeId: string }
  | { kind: 'node-discovered'; nodeId: string }
  /** Nothing to discover: the passage of time is what surfaces it. */
  | { kind: 'time'; days: number }

export interface ValidationRule {
  evaluate: (state: GameState, index: ContentIndex) => RuleVerdict
  revealedBy: RevealCondition
}

/** Registry of assumption validation rules referenced by content id. */
export const VALIDATION_RULES: Record<string, ValidationRule> = {
  'control-coverage-holds': {
    evaluate: () => ({ holds: true }),
    revealedBy: { kind: 'time', days: 30 },
  },

  'mfa-covers-external-admins': {
    evaluate: (state) => {
      const mfa = state.controls.controls['ctl-mfa']
      if (!mfa) return { holds: true }
      return mfa.coverage >= 0.78
        ? { holds: true }
        : { holds: false, reason: 'Multi-factor authentication does not in fact cover all external administrators.' }
    },
    revealedBy: { kind: 'control-assessed', controlId: 'ctl-mfa' },
  },

  'supplier-has-no-privileged-access': {
    evaluate: (state) => {
      const edge = state.organisation.edges['edge-msp-admins-identity']
      if (!edge || !edge.exists) return { holds: true }
      return edge.discovered
        ? { holds: false, reason: 'The managed service provider does hold privileged access into the identity platform.' }
        : { holds: true }
    },
    revealedBy: { kind: 'edge-discovered', edgeId: 'edge-msp-admins-identity' },
  },

  'legacy-remains-isolated': {
    evaluate: (state) => {
      const edge = state.organisation.edges['edge-legacy-to-core']
      if (!edge || !edge.exists) return { holds: true }
      return edge.discovered
        ? { holds: false, reason: 'The legacy estate is routable into the core platform after all.' }
        : { holds: true }
    },
    revealedBy: { kind: 'edge-discovered', edgeId: 'edge-legacy-to-core' },
  },

  'backups-recover-within-tolerance': {
    evaluate: (state) => {
      const backup = state.controls.controls['ctl-backup']
      if (!backup) return { holds: true }
      return calculateControlEffectiveness(backup) >= 0.45
        ? { holds: true }
        : { holds: false, reason: 'Recovery capability is below the tolerance the decision assumed.' }
    },
    revealedBy: { kind: 'control-assessed', controlId: 'ctl-backup' },
  },

  'retirement-before-q4': {
    evaluate: (state) => {
      const retirement = state.flags['legacy.retirementDay']
      if (typeof retirement !== 'number') return { holds: true }
      return retirement <= 273
        ? { holds: true }
        : { holds: false, reason: 'The retirement date has moved beyond the end of Q3.' }
    },
    revealedBy: { kind: 'time', days: 1 },
  },

  'payments-platform-unchanged': {
    evaluate: (state) => {
      const node = state.organisation.nodes['node-payments-platform']
      if (!node) return { holds: true }
      return node.exposure <= 0.62
        ? { holds: true }
        : { holds: false, reason: 'The payments platform is now more exposed than when the decision was taken.' }
    },
    revealedBy: { kind: 'time', days: 1 },
  },

  'privileged-access-recertified': {
    evaluate: (state) => {
      const pam = state.controls.controls['ctl-pam']
      if (!pam) return { holds: true }
      return pam.exceptionRate <= 0.35
        ? { holds: true }
        : { holds: false, reason: 'Standing privileged exceptions have grown well past the level assumed.' }
    },
    revealedBy: { kind: 'control-assessed', controlId: 'ctl-pam' },
  },

  'no-active-threat-campaign': {
    evaluate: (state) => {
      const active = state.threats.campaigns.some((c) => !c.disrupted && !c.incidentId && c.detected)
      return active
        ? { holds: false, reason: 'There is now detected adversary activity inside the environment.' }
        : { holds: true }
    },
    revealedBy: { kind: 'time', days: 1 },
  },

  'soc-coverage-is-sufficient': {
    evaluate: (state) => {
      const logging = state.controls.controls['ctl-logging']
      if (!logging) return { holds: true }
      return logging.monitoringQuality >= 0.45 && logging.coverage >= 0.5
        ? { holds: true }
        : { holds: false, reason: 'Telemetry coverage no longer supports the monitoring the decision assumed.' }
    },
    revealedBy: { kind: 'control-assessed', controlId: 'ctl-logging' },
  },

  'cloud-migration-on-schedule': {
    evaluate: (state) => {
      const objective = state.business.objectives['obj-cloud-migration']
      if (!objective) return { holds: true }
      return objective.status !== 'at-risk' && objective.status !== 'failed'
        ? { holds: true }
        : { holds: false, reason: 'The cloud migration is no longer running to the schedule the decision assumed.' }
    },
    revealedBy: { kind: 'time', days: 1 },
  },
}

/** Does the assumption hold right now, against simulation truth? */
export function evaluateAssumption(
  state: GameState,
  index: ContentIndex,
  validationRuleId: string,
): RuleVerdict | undefined {
  return VALIDATION_RULES[validationRuleId]?.evaluate(state, index)
}

/**
 * Has the player learned enough to see through a never-true assumption?
 *
 * Assurance is what closes the gap between belief and truth, so an assessment
 * only counts if it happened after the assumption was recorded — reading a
 * stale report from before the decision teaches nobody anything.
 */
export function hasBeenRevealed(
  state: GameState,
  reveal: RevealCondition,
  recordedDay: number,
): boolean {
  switch (reveal.kind) {
    case 'control-assessed': {
      const control = state.controls.controls[reveal.controlId]
      if (!control?.believed) return false
      return control.believed.assessedOnDay >= recordedDay
    }
    case 'edge-discovered': {
      const edge = state.organisation.edges[reveal.edgeId]
      return Boolean(edge?.exists && edge.discovered)
    }
    case 'node-discovered': {
      const node = state.organisation.nodes[reveal.nodeId]
      return Boolean(node?.exists && node.discovered)
    }
    case 'time':
      return state.currentDay - recordedDay >= reveal.days
    default: {
      const exhaustive: never = reveal
      void exhaustive
      return true
    }
  }
}

export interface AssumptionTickResult {
  invalidated: {
    assumptionId: string
    statement: string
    reason: string
    /** True when the assumption was never true, rather than overtaken. */
    wasNeverTrue: boolean
    decisionId?: string
    scenarioIds: string[]
  }[]
  dueForReview: string[]
}

export function tickAssumptions(state: GameState, index: ContentIndex): AssumptionTickResult {
  const result: AssumptionTickResult = { invalidated: [], dueForReview: [] }

  for (const assumption of Object.values(state.assumptions.assumptions)) {
    if (assumption.status === 'invalidated') continue
    const def = index.assumption.get(assumption.defId)
    if (!def) continue
    const rule = VALIDATION_RULES[def.validationRuleId]
    if (!rule) continue

    const verdict = rule.evaluate(state, index)
    if (!verdict.holds) {
      // An assumption that was never true waits for the player's knowledge to
      // catch up. One that was true when made surfaces as soon as it breaks.
      const neverTrue = assumption.heldWhenRecorded === false
      if (neverTrue && !hasBeenRevealed(state, rule.revealedBy, assumption.createdDay)) continue

      assumption.status = 'invalidated'
      assumption.invalidatedDay = state.currentDay
      assumption.invalidationReason = neverTrue
        ? `${verdict.reason ?? 'This was not the case.'} It was not true when you relied on it either — you have only just found out.`
        : (verdict.reason ?? 'The world no longer supports this assumption.')

      for (const scenarioId of assumption.linkedScenarioIds) {
        const scenario = state.risks.scenarios[scenarioId]
        if (scenario) scenario.nextReviewDay = state.currentDay
      }
      result.invalidated.push({
        assumptionId: assumption.id,
        statement: assumption.statement,
        reason: assumption.invalidationReason,
        wasNeverTrue: neverTrue,
        decisionId: assumption.linkedDecisionId,
        scenarioIds: assumption.linkedScenarioIds,
      })
      continue
    }

    if (assumption.nextReviewDay !== undefined && state.currentDay >= assumption.nextReviewDay) {
      assumption.status = 'uncertain'
      result.dueForReview.push(assumption.id)
      assumption.nextReviewDay = state.currentDay + 45
    }
  }
  return result
}

export function invalidatedAssumptions(state: GameState) {
  return Object.values(state.assumptions.assumptions).filter((a) => a.status === 'invalidated')
}

/**
 * Assumptions that were never true and that the player never went and checked.
 * These are blind spots in the strict sense: relied on all year, never tested.
 */
export function unexaminedAssumptions(state: GameState) {
  return Object.values(state.assumptions.assumptions).filter(
    (assumption) => assumption.heldWhenRecorded === false && assumption.status !== 'invalidated',
  )
}
