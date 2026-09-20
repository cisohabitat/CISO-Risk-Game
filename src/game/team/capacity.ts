/**
 * Team capacity, workload and delegation quality (plan §10.2, §11).
 *
 * Capacity is "days of effort per week" per function. Two things consume it and
 * they compete for the same people: delegated work (investigations, reviews)
 * and live cyber programmes. Committed capacity is therefore *derived* from
 * both every day rather than incremented and decremented as work starts and
 * stops — an accounting that quietly drifts and, in an earlier version of this
 * file, let programmes demand people without ever occupying them.
 *
 * Committed capacity above the available pool becomes strain, which degrades
 * the quality of delegated work and grinds morale down. The CISO cannot do
 * everything personally: leaders carry the work, and tired leaders do it worse.
 */
import type { CapacityBand, ContentIndex, CyberFunction, GameState, LeaderRuntime } from '../types'
import { CYBER_FUNCTIONS, clamp01 } from '../types'

export function functionStrain(state: GameState, fn: CyberFunction): number {
  const runtime = state.team.functions[fn]
  if (!runtime || runtime.capacity <= 0) return 1
  return clamp01(runtime.committed / runtime.capacity)
}

/**
 * Whole-team strain.
 *
 * Deliberately not a simple average of committed over capacity. Identity can be
 * at a hundred per cent while the SOC idles, and an IAM engineer cannot cover a
 * SOC shift — a plain average hides exactly the situation the player needs to
 * see. The measure therefore leans on the most pressed functions while still
 * accounting for the whole team, so one busy corner registers without a single
 * small team dominating the reading.
 */
export function teamStrain(state: GameState): number {
  let committed = 0
  let capacity = 0
  let worst = 0
  for (const fn of CYBER_FUNCTIONS) {
    const runtime = state.team.functions[fn]
    if (!runtime) continue
    committed += runtime.committed
    capacity += runtime.capacity
    worst = Math.max(worst, functionStrain(state, fn))
  }
  if (capacity <= 0) return 1
  const across = clamp01(committed / capacity)
  return clamp01(0.4 * across + 0.6 * worst)
}

export function capacityBand(strain: number): CapacityBand {
  if (strain < 0.45) return 'available'
  if (strain < 0.7) return 'committed'
  if (strain < 0.88) return 'stretched'
  if (strain < 0.97) return 'overloaded'
  return 'breaking'
}

export const CAPACITY_BAND_LABEL: Record<CapacityBand, string> = {
  available: 'Available',
  committed: 'Committed',
  stretched: 'Stretched',
  overloaded: 'Overloaded',
  breaking: 'At breaking point',
}

/** Free capacity in a function, in effort-days per week. */
export function availableCapacity(state: GameState, fn: CyberFunction): number {
  const runtime = state.team.functions[fn]
  if (!runtime) return 0
  return Math.max(0, runtime.capacity - runtime.committed)
}

export function canAfford(state: GameState, demand: Partial<Record<CyberFunction, number>>): boolean {
  for (const [fn, amount] of Object.entries(demand)) {
    if (!amount) continue
    if (availableCapacity(state, fn as CyberFunction) + 1e-9 < amount) return false
  }
  return true
}

/**
 * What each function is currently committed to, counted from the work that
 * actually exists. `excludeProgrammeId` lets a programme ask how loaded the
 * team would be without its own demand, so it does not starve itself.
 */
export function computeCommitted(
  state: GameState,
  index: ContentIndex,
  excludeProgrammeId?: string,
): Record<string, number> {
  const committed: Record<string, number> = {}
  for (const fn of CYBER_FUNCTIONS) committed[fn] = 0

  for (const assignment of state.team.assignments) {
    if (assignment.status !== 'running') continue
    for (const [fn, amount] of Object.entries(assignment.capacityPerDay)) {
      if (amount) committed[fn] = (committed[fn] ?? 0) + amount
    }
  }

  // Live programmes hold people for as long as they run. This is the pressure
  // that makes "start everything" a real choice rather than a budget question.
  for (const programme of Object.values(state.programmes.programmes)) {
    if (programme.id === excludeProgrammeId) continue
    if (programme.status !== 'active' && programme.status !== 'at-risk') continue
    const def = index.programme.get(programme.id)
    if (!def) continue
    for (const [fn, amount] of Object.entries(def.capacityDemand)) {
      if (amount) committed[fn] = (committed[fn] ?? 0) + amount
    }
  }

  // Short-lived surges (an incident, a burst of unplanned work) decay on their own.
  for (const fn of CYBER_FUNCTIONS) {
    const runtime = state.team.functions[fn]
    if (runtime?.surge) committed[fn] = (committed[fn] ?? 0) + runtime.surge
  }
  return committed
}

/** Recomputes committed capacity for every function. Called once per tick. */
export function refreshCommittedCapacity(state: GameState, index: ContentIndex): void {
  const committed = computeCommitted(state, index)
  for (const fn of CYBER_FUNCTIONS) {
    const runtime = state.team.functions[fn]
    if (!runtime) continue
    runtime.committed = Math.round((committed[fn] ?? 0) * 100) / 100
    // Surges fade rather than persisting for the rest of the campaign.
    if (runtime.surge) runtime.surge = Math.max(0, Math.round((runtime.surge - 0.15) * 100) / 100)
  }
}

/**
 * Quality of delegated work, 0..1.
 * Skill sets the ceiling; workload and low morale pull it down; reliability
 * governs the spread, so an unreliable leader is a gamble either way.
 */
export function delegationQuality(leader: LeaderRuntime, strain: number, roll: number): number {
  const workloadPenalty = 0.35 * clamp01(leader.workload) + 0.2 * clamp01(strain)
  const moralePenalty = 0.2 * (1 - clamp01(leader.morale))
  const centre = clamp01(leader.skill - workloadPenalty - moralePenalty)
  const spread = 0.28 * (1 - clamp01(leader.reliability))
  return clamp01(centre + (roll - 0.5) * 2 * spread)
}

/** Extra days a delegated assignment slips, given workload and reliability. */
export function delegationDelayDays(leader: LeaderRuntime, strain: number, roll: number): number {
  const pressure = 0.5 * clamp01(leader.workload) + 0.5 * clamp01(strain)
  const risk = clamp01(pressure * (1.2 - clamp01(leader.reliability)))
  if (roll > risk) return 0
  return 1 + Math.floor(roll * 6 * risk * 3)
}

export function qualityLabel(quality: number): string {
  if (quality < 0.3) return 'Thin'
  if (quality < 0.5) return 'Partial'
  if (quality < 0.7) return 'Sound'
  if (quality < 0.86) return 'Thorough'
  return 'Exceptional'
}

/**
 * A cyber function named in prose. The annual review printed the raw enum into
 * its closing paragraph — "Your architecture and grc functions are spent" — on
 * the last screen of the game. `src/lib/formatting` has two maps of these, but
 * the engine cannot reach them, so the words a reviewer sentence needs live
 * here beside the other presentation helpers.
 */
export function functionName(fn: string): string {
  switch (fn) {
    case 'soc':
      return 'SOC'
    case 'grc':
      return 'cyber risk'
    case 'iam':
      return 'identity'
    case 'incident-response':
      return 'incident response'
    default:
      return fn
  }
}

export function moraleLabel(morale: number): string {
  if (morale < 0.25) return 'Burning out'
  if (morale < 0.45) return 'Strained'
  if (morale < 0.65) return 'Holding up'
  if (morale < 0.85) return 'Steady'
  return 'Energised'
}

/**
 * Daily morale/workload movement. Sustained overcommitment grinds people down
 * and recovery is slower than the decline, which is what makes over-delegation
 * a real strategic cost rather than a free action.
 */
export function updateTeamWellbeing(state: GameState): void {
  for (const fn of CYBER_FUNCTIONS) {
    const runtime = state.team.functions[fn]
    if (!runtime) continue
    const strain = functionStrain(state, fn)
    // Grinding down is faster than recovering, which is what makes sustained
    // overload a decision with a cost rather than a temporary inconvenience.
    if (strain > 0.7) runtime.morale = clamp01(runtime.morale - 0.006 * (1 + (strain - 0.7) * 5))
    else if (strain < 0.5) runtime.morale = clamp01(runtime.morale + 0.0012)
    if (runtime.vacancies > 0) runtime.morale = clamp01(runtime.morale - 0.0015 * runtime.vacancies)
  }
  for (const leader of Object.values(state.team.leaders)) {
    const target = clamp01(leaderLoad(state, leader.id))
    leader.workload = clamp01(leader.workload + (target - leader.workload) * 0.25)
    if (leader.workload > 0.7) leader.morale = clamp01(leader.morale - 0.005)
    else if (leader.workload < 0.45) leader.morale = clamp01(leader.morale + 0.001)
  }
}

/** Fraction of a leader's week taken by their live assignments. */
export function leaderLoad(state: GameState, leaderId: string): number {
  const running = state.team.assignments.filter((a) => a.leaderId === leaderId && a.status === 'running')
  let total = 0
  for (const assignment of running) {
    for (const amount of Object.values(assignment.capacityPerDay)) total += amount ?? 0
  }
  return clamp01(total / 5)
}
