/**
 * Team capacity, workload and delegation quality (plan §10.2, §11).
 *
 * Capacity is expressed in "days of effort per week" per function. Assignments
 * commit capacity for their duration; committed capacity above the available
 * pool becomes strain, which degrades quality and morale. The CISO cannot do
 * everything personally: leaders carry the work, and tired leaders do it worse.
 */
import type { CapacityBand, CyberFunction, GameState, LeaderRuntime } from '../types'
import { CYBER_FUNCTIONS, clamp01 } from '../types'

export function functionStrain(state: GameState, fn: CyberFunction): number {
  const runtime = state.team.functions[fn]
  if (!runtime || runtime.capacity <= 0) return 1
  return clamp01(runtime.committed / runtime.capacity)
}

/** Whole-team strain, weighted by how much capacity each function holds. */
export function teamStrain(state: GameState): number {
  let committed = 0
  let capacity = 0
  for (const fn of CYBER_FUNCTIONS) {
    const runtime = state.team.functions[fn]
    if (!runtime) continue
    committed += runtime.committed
    capacity += runtime.capacity
  }
  if (capacity <= 0) return 1
  return clamp01(committed / capacity)
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

export function commitCapacity(state: GameState, demand: Partial<Record<CyberFunction, number>>, sign = 1): void {
  for (const [fn, amount] of Object.entries(demand)) {
    if (!amount) continue
    const runtime = state.team.functions[fn]
    if (!runtime) continue
    runtime.committed = Math.max(0, runtime.committed + amount * sign)
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
    if (strain > 0.85) runtime.morale = clamp01(runtime.morale - 0.004 * (1 + (strain - 0.85) * 4))
    else if (strain < 0.6) runtime.morale = clamp01(runtime.morale + 0.0018)
    if (runtime.vacancies > 0) runtime.morale = clamp01(runtime.morale - 0.0008 * runtime.vacancies)
  }
  for (const leader of Object.values(state.team.leaders)) {
    const target = clamp01(leaderLoad(state, leader.id))
    leader.workload = clamp01(leader.workload + (target - leader.workload) * 0.25)
    if (leader.workload > 0.8) leader.morale = clamp01(leader.morale - 0.003)
    else if (leader.workload < 0.5) leader.morale = clamp01(leader.morale + 0.0015)
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
