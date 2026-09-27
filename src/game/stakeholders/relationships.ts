/**
 * Stakeholder relationships (plan §19). Trust is a hidden number; the player
 * only ever sees a band and the person's own words. Stakeholders remember.
 */
import type { ContentIndex, GameState, RelationshipBand, StakeholderRuntime } from '../types'
import { clamp01 } from '../types'
import { DIFFICULTY_PROFILES } from '../engine/setup'

export function relationshipBand(trust: number): RelationshipBand {
  if (trust < 0.2) return 'resistant'
  if (trust < 0.4) return 'cautious'
  if (trust < 0.6) return 'neutral'
  if (trust < 0.8) return 'supportive'
  return 'trusted'
}

export const RELATIONSHIP_LABEL: Record<RelationshipBand, string> = {
  resistant: 'Resistant',
  cautious: 'Cautious',
  neutral: 'Neutral',
  supportive: 'Supportive',
  trusted: 'Trusted',
}

/**
 * Relationships drift towards neutral when the CISO never engages: attention is
 * itself an act of influence.
 */
export function tickRelationships(state: GameState): void {
  for (const person of Object.values(state.stakeholders.stakeholders)) {
    const drift = person.trust > 0.5 ? -0.0006 : 0.0004
    person.trust = clamp01(person.trust + drift)
  }
  // Board confidence follows the executives' view of the CISO, slowly. At a
  // percent a day a good paper was forgotten inside two months, and the
  // standing on the home screen read "Neutral" on nine days in ten whatever
  // the player did. At 0.4% a paper is remembered for about a season.
  const trusts = Object.values(state.stakeholders.stakeholders).map((p) => p.trust)
  if (trusts.length > 0) {
    const avg = trusts.reduce((sum, v) => sum + v, 0) / trusts.length
    state.stakeholders.boardConfidence = clamp01(
      state.stakeholders.boardConfidence + (avg - state.stakeholders.boardConfidence) * 0.004,
    )
  }
  // Patience recovers towards the level this organisation actually has, and
  // no further. It used to climb 0.0015 a day with no ceiling, which is +0.55
  // over a year against a 0.24 spread between the modes: every mode finished
  // the year at or near maximum patience, and "less executive patience" stopped
  // describing high pressure after about week seven. Recovering towards the
  // profile's own value keeps the dial true all year, and spending patience
  // still costs something until the organisation forgives it.
  const baseline = DIFFICULTY_PROFILES[state.difficulty].executiveTolerance
  const tolerance = state.stakeholders.operationalTolerance
  state.stakeholders.operationalTolerance = clamp01(tolerance + (baseline - tolerance) * 0.01)
}

export function boardConfidenceLabel(value: number): string {
  if (value < 0.25) return 'Fragile'
  if (value < 0.45) return 'Questioning'
  if (value < 0.65) return 'Neutral'
  if (value < 0.82) return 'Solid'
  return 'Strong'
}

/**
 * A stakeholder's appetite for a security ask, blending trust, their own risk
 * tolerance and how well they understand the argument.
 */
export function supportLikelihood(person: StakeholderRuntime, demandSeverity: number): number {
  const willingness = 0.55 * person.trust + 0.25 * person.cyberUnderstanding + 0.2 * (1 - person.riskTolerance)
  return clamp01(willingness - demandSeverity * 0.45)
}

export function remember(
  state: GameState,
  stakeholderId: string,
  summary: string,
  sentiment: 'positive' | 'negative' | 'neutral',
): void {
  const person = state.stakeholders.stakeholders[stakeholderId]
  if (!person) return
  person.memory.unshift({ day: state.currentDay, summary, sentiment })
  person.memory = person.memory.slice(0, 24)
}

export function describeStakeholder(
  state: GameState,
  index: ContentIndex,
  stakeholderId: string,
): { name: string; role: string; band: RelationshipBand; concerns: string[] } | undefined {
  const def = index.stakeholder.get(stakeholderId)
  const runtime = state.stakeholders.stakeholders[stakeholderId]
  if (!def || !runtime) return undefined
  return {
    name: def.name,
    role: def.role,
    band: relationshipBand(runtime.trust),
    concerns: runtime.concerns,
  }
}
