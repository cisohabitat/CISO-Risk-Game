/**
 * Cyber programmes build capability over months (plan §18). Progress is bought
 * with money *and* people: an underfunded or understaffed programme crawls, and
 * blockers appear that need executive help rather than more money.
 */
import type { ContentIndex, GameEffect, GameState, ProgrammeRuntime } from '../types'
import { clamp01 } from '../types'
import type { Rng } from '../engine/rng'
import { computeCommitted } from '../team/capacity'
import { evaluateCondition } from '../events/conditions'

export interface ProgrammeTickResult {
  effects: GameEffect[]
  milestones: { programmeId: string; milestoneId: string; name: string; description: string }[]
  completed: string[]
  newBlockers: { programmeId: string; blockerId: string; name: string; description: string }[]
}

/** Share of the programme's weekly capacity demand that the team can meet. */
export function computeStaffing(state: GameState, index: ContentIndex, programme: ProgrammeRuntime): number {
  const def = index.programme.get(programme.id)
  if (!def) return 0
  const demands = Object.entries(def.capacityDemand)
  if (demands.length === 0) return 1

  // Measured against everyone else's load, so a programme never starves itself.
  const others = computeCommitted(state, index, programme.id)
  let met = 0
  let total = 0
  for (const [fn, demand] of demands) {
    if (!demand) continue
    total += demand
    const runtime = state.team.functions[fn]
    if (!runtime) continue
    const spare = Math.max(0, runtime.capacity - (others[fn] ?? 0))
    met += Math.min(demand, spare)
  }
  return total > 0 ? clamp01(met / total) : 1
}

export function tickProgrammes(state: GameState, index: ContentIndex, rng: Rng): ProgrammeTickResult {
  const result: ProgrammeTickResult = { effects: [], milestones: [], completed: [], newBlockers: [] }

  for (const programme of Object.values(state.programmes.programmes)) {
    const def = index.programme.get(programme.id)
    if (!def) continue
    if (programme.status !== 'active' && programme.status !== 'at-risk') continue

    programme.staffing = computeStaffing(state, index, programme)

    // Blockers: real programmes stall on things money cannot fix.
    for (const blocker of def.blockers) {
      if (programme.blockers.some((b) => b.id === blocker.id)) continue
      const exposureToBlockers = 0.5 + 0.5 * (1 - programme.staffing)
      // A blocker some earlier choice has already removed does not arise: a
      // second year was blocked by "The managed service contract does not
      // oblige the provider…" after the first wrote the terms into the
      // contract (AI second-year re-test). The draw is still made, so the
      // rest of the year's draws do not move.
      const drawn = rng.chance(blocker.chancePerDay * exposureToBlockers)
      if (drawn && !(blocker.unlessCondition && evaluateCondition(state, index, blocker.unlessCondition))) {
        programme.blockers.push({ id: blocker.id, startedDay: state.currentDay, resolved: false })
        programme.status = 'at-risk'
        result.newBlockers.push({
          programmeId: programme.id,
          blockerId: blocker.id,
          name: blocker.name,
          description: blocker.description,
        })
      }
    }

    let blockerMultiplier = 1
    for (const active of programme.blockers) {
      if (active.resolved) continue
      const blockerDef = def.blockers.find((b) => b.id === active.id)
      if (blockerDef) blockerMultiplier *= blockerDef.progressMultiplier
    }

    const fundingRatio = def.budgetCost > 0 ? clamp01(programme.budgetAllocated / def.budgetCost) : 1
    const dailyBase = 1 / Math.max(1, def.durationDays)
    const acceleration = programme.accelerated ? 1.35 : 1
    const friction = 1 - clamp01(programme.deliveryFriction)
    const delta =
      dailyBase *
      acceleration *
      friction *
      blockerMultiplier *
      (0.25 + 0.75 * programme.staffing) *
      (0.35 + 0.65 * fundingRatio)

    const before = programme.progress
    programme.progress = clamp01(programme.progress + delta)

    // Spend tracks delivery, so a paused programme stops burning budget.
    const spendThisDay = def.budgetCost * (programme.progress - before)
    programme.budgetSpent = Math.round((programme.budgetSpent + spendThisDay) * 100) / 100

    for (const milestone of def.milestones) {
      if (programme.completedMilestoneIds.includes(milestone.id)) continue
      if (programme.progress + 1e-9 < milestone.atProgress) continue
      programme.completedMilestoneIds.push(milestone.id)
      result.milestones.push({
        programmeId: programme.id,
        milestoneId: milestone.id,
        name: milestone.name,
        description: milestone.description,
      })
      for (const controlEffect of milestone.controlEffects) {
        result.effects.push(...controlEffectToEffects(controlEffect))
      }
      if (milestone.effects) result.effects.push(...milestone.effects)
    }

    if (programme.progress >= 1) {
      programme.status = 'complete'
      programme.completedDay = state.currentDay
      // Delivered is delivered: a blocker the programme crawled past is over
      // with it, and listing it after delivery read as still in the way (AI
      // tablet playtest).
      for (const blocker of programme.blockers) blocker.resolved = true
      result.completed.push(programme.id)
    }
  }

  return result
}

export function controlEffectToEffects(effect: {
  controlId: string
  coverage?: number
  configurationQuality?: number
  operationalEffectiveness?: number
  monitoringQuality?: number
  exceptionRate?: number
}): GameEffect[] {
  const out: GameEffect[] = []
  if (effect.coverage) out.push({ type: 'control.coverage', controlId: effect.controlId, delta: effect.coverage })
  if (effect.configurationQuality)
    out.push({ type: 'control.configuration', controlId: effect.controlId, delta: effect.configurationQuality })
  if (effect.operationalEffectiveness)
    out.push({ type: 'control.operational', controlId: effect.controlId, delta: effect.operationalEffectiveness })
  if (effect.monitoringQuality)
    out.push({ type: 'control.monitoring', controlId: effect.controlId, delta: effect.monitoringQuality })
  if (effect.exceptionRate)
    out.push({ type: 'control.exceptions', controlId: effect.controlId, delta: effect.exceptionRate })
  return out
}

/** Which controls a live programme is actively maintaining (blocks drift). */
export function maintainedControlIds(state: GameState, index: ContentIndex): Set<string> {
  const ids = new Set<string>()
  for (const programme of Object.values(state.programmes.programmes)) {
    if (programme.status !== 'active' && programme.status !== 'at-risk' && programme.status !== 'complete') continue
    const def = index.programme.get(programme.id)
    if (!def) continue
    // A completed programme keeps its controls fresh for a while, then drift resumes.
    if (programme.status === 'complete' && state.currentDay - (programme.completedDay ?? 0) > 120) continue
    for (const milestone of def.milestones) {
      for (const effect of milestone.controlEffects) ids.add(effect.controlId)
    }
  }
  return ids
}

export function deliveryConfidence(programme: ProgrammeRuntime, index: ContentIndex, currentDay: number): number {
  const def = index.programme.get(programme.id)
  if (!def || programme.startedDay === undefined) return 0.5
  const elapsed = currentDay - programme.startedDay
  const expected = clamp01(elapsed / Math.max(1, def.durationDays))
  const unresolvedBlockers = programme.blockers.filter((b) => !b.resolved).length
  const gap = programme.progress - expected
  return clamp01(0.6 + gap * 1.6 - unresolvedBlockers * 0.18 + (programme.staffing - 0.7) * 0.4)
}

export function deliveryConfidenceLabel(value: number): string {
  if (value < 0.3) return 'Low'
  if (value < 0.5) return 'Fragile'
  if (value < 0.72) return 'Reasonable'
  return 'Good'
}
