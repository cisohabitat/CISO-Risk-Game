/**
 * Assumption system (plan §13).
 *
 * A material decision rests on assumptions. The world keeps moving; when it
 * contradicts one, the assumption is invalidated, an event is raised, and every
 * decision and risk scenario that leaned on it is flagged for reassessment.
 * Rules are named predicates so they stay deterministic and unit-testable.
 */
import type { ContentIndex, GameState } from '../types'
import { calculateControlEffectiveness } from '../controls/effectiveness'

export type ValidationRule = (state: GameState, index: ContentIndex) => { holds: boolean; reason?: string }

/** Registry of assumption validation rules referenced by content id. */
export const VALIDATION_RULES: Record<string, ValidationRule> = {
  'control-coverage-holds': () => ({ holds: true }),

  'mfa-covers-external-admins': (state) => {
    const mfa = state.controls.controls['ctl-mfa']
    if (!mfa) return { holds: true }
    return mfa.coverage >= 0.78
      ? { holds: true }
      : { holds: false, reason: 'Multi-factor authentication does not in fact cover all external administrators.' }
  },

  'supplier-has-no-privileged-access': (state) => {
    const edge = state.organisation.edges['edge-msp-admins-identity']
    if (!edge || !edge.exists) return { holds: true }
    return edge.discovered
      ? { holds: false, reason: 'The managed service provider does hold privileged access into the identity platform.' }
      : { holds: true }
  },

  'legacy-remains-isolated': (state) => {
    const edge = state.organisation.edges['edge-legacy-to-core']
    if (!edge || !edge.exists) return { holds: true }
    return edge.discovered
      ? { holds: false, reason: 'The legacy estate is routable into the core platform after all.' }
      : { holds: true }
  },

  'backups-recover-within-tolerance': (state) => {
    const backup = state.controls.controls['ctl-backup']
    if (!backup) return { holds: true }
    const effectiveness = calculateControlEffectiveness(backup)
    return effectiveness >= 0.45
      ? { holds: true }
      : { holds: false, reason: 'Recovery capability has fallen below the tolerance the decision assumed.' }
  },

  'retirement-before-q4': (state) => {
    const retirement = state.flags['legacy.retirementDay']
    if (typeof retirement !== 'number') return { holds: true }
    return retirement <= 273
      ? { holds: true }
      : { holds: false, reason: 'The retirement date has moved beyond the end of Q3.' }
  },

  'payments-platform-unchanged': (state) => {
    const node = state.organisation.nodes['node-payments-platform']
    if (!node) return { holds: true }
    return node.exposure <= 0.62
      ? { holds: true }
      : { holds: false, reason: 'The payments platform is now more exposed than when the decision was taken.' }
  },

  'privileged-access-recertified': (state) => {
    const pam = state.controls.controls['ctl-pam']
    if (!pam) return { holds: true }
    return pam.exceptionRate <= 0.35
      ? { holds: true }
      : { holds: false, reason: 'Standing privileged exceptions have grown well past the level assumed.' }
  },

  'no-active-threat-campaign': (state) => {
    const active = state.threats.campaigns.some((c) => !c.disrupted && !c.incidentId && c.detected)
    return active
      ? { holds: false, reason: 'There is now detected adversary activity inside the environment.' }
      : { holds: true }
  },

  'soc-coverage-is-sufficient': (state) => {
    const logging = state.controls.controls['ctl-logging']
    if (!logging) return { holds: true }
    return logging.monitoringQuality >= 0.45 && logging.coverage >= 0.5
      ? { holds: true }
      : { holds: false, reason: 'Telemetry coverage no longer supports the monitoring the decision assumed.' }
  },

  'cloud-migration-on-schedule': (state) => {
    const objective = state.business.objectives['obj-cloud-migration']
    if (!objective) return { holds: true }
    return objective.status !== 'at-risk' && objective.status !== 'failed'
      ? { holds: true }
      : { holds: false, reason: 'The cloud migration is no longer running to the schedule the decision assumed.' }
  },
}

export interface AssumptionTickResult {
  invalidated: {
    assumptionId: string
    statement: string
    reason: string
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

    const verdict = rule(state, index)
    if (!verdict.holds) {
      assumption.status = 'invalidated'
      assumption.invalidatedDay = state.currentDay
      assumption.invalidationReason = verdict.reason ?? 'The world no longer supports this assumption.'
      // Everything that leaned on it now needs looking at again.
      for (const scenarioId of assumption.linkedScenarioIds) {
        const scenario = state.risks.scenarios[scenarioId]
        if (scenario) scenario.nextReviewDay = state.currentDay
      }
      result.invalidated.push({
        assumptionId: assumption.id,
        statement: assumption.statement,
        reason: assumption.invalidationReason,
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
