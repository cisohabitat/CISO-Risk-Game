/**
 * Event engine (plan §23). Events are conditional story delivery, not a quiz
 * queue: an event fires when the world makes it plausible. A small number of
 * pinned events carry the campaign's narrative spine.
 */
import type { ContentIndex, GameEffect, GameEventDef, GameState } from '../types'
import type { Rng } from '../engine/rng'
import { DIFFICULTY_PROFILES } from '../engine/setup'
import { evaluateAll } from './conditions'

export interface FiredEvent {
  def: GameEventDef
  effects: GameEffect[]
}

export interface EventTickResult {
  fired: FiredEvent[]
}

function isEligible(state: GameState, index: ContentIndex, def: GameEventDef): boolean {
  if (state.events.suppressedEventIds.includes(def.id)) return false
  if (state.currentDay < def.availableFromDay) return false
  if (def.availableUntilDay !== undefined && state.currentDay > def.availableUntilDay) return false
  if (def.oncePerCampaign && state.events.firedEventIds.includes(def.id)) return false
  const lastFired = state.events.firedOnDay[def.id]
  if (lastFired !== undefined && def.cooldownDays !== undefined && state.currentDay - lastFired < def.cooldownDays) {
    return false
  }
  if (lastFired !== undefined && def.cooldownDays === undefined && !def.oncePerCampaign) {
    // Repeatable events without an explicit cooldown still need breathing room.
    if (state.currentDay - lastFired < 21) return false
  }
  for (const tag of def.tags) {
    const tagDay = state.events.lastFiredDayByTag[tag]
    if (tagDay !== undefined && state.currentDay - tagDay < 4) return false
  }
  return evaluateAll(state, index, def.conditions)
}

/** How many unpinned events the player should receive on a given day. */
function dailyBudget(state: GameState, rng: Rng): number {
  const openDecisions = state.decisions.openIds.length
  if (openDecisions >= 5) return 0
  const incidentRunning = Object.values(state.incidents.incidents).some((i) => i.phase !== 'closed')
  if (incidentRunning) return rng.chance(0.25) ? 1 : 0
  if (state.currentDay < 3) return 1
  const roll = rng.next()
  if (roll < 0.42) return 0
  if (roll < 0.86) return 1
  return 2
}

export function tickEvents(state: GameState, index: ContentIndex, rng: Rng): EventTickResult {
  const result: EventTickResult = { fired: [] }
  const firedThisDay = new Set<string>()

  const fire = (def: GameEventDef) => {
    if (firedThisDay.has(def.id)) return
    firedThisDay.add(def.id)
    if (!state.events.firedEventIds.includes(def.id)) state.events.firedEventIds.push(def.id)
    state.events.firedOnDay[def.id] = state.currentDay
    for (const tag of def.tags) state.events.lastFiredDayByTag[tag] = state.currentDay
    result.fired.push({ def, effects: def.effectsOnReveal ?? [] })
  }

  // 1. Explicitly scheduled events (delayed consequences) come first.
  const due = state.events.scheduled.filter((entry) => entry.day <= state.currentDay)
  if (due.length > 0) {
    state.events.scheduled = state.events.scheduled.filter((entry) => entry.day > state.currentDay)
    for (const entry of due) {
      const def = index.event.get(entry.eventId)
      if (!def) continue
      if (state.events.suppressedEventIds.includes(def.id)) continue
      fire(def)
    }
  }

  // 2. Pinned narrative beats fire as soon as they become possible.
  for (const def of index.content.events) {
    if (!def.pinned || def.scheduledOnly) continue
    if (!isEligible(state, index, def)) continue
    fire(def)
  }

  // 3. Conditional pool, weighted, within the day's budget.
  const budget = dailyBudget(state, rng)
  if (budget > 0) {
    const pool = index.content.events.filter(
      (def) => !def.pinned && !def.scheduledOnly && !firedThisDay.has(def.id) && isEligible(state, index, def),
    )
    for (let i = 0; i < budget; i += 1) {
      const remaining = pool.filter((def) => !firedThisDay.has(def.id))
      if (remaining.length === 0) break
      // Harder difficulties bury the material signal in more noise (plan §44).
      // Measured as near-inert: only two authored events carry the tag and
      // both fire in every campaign whatever the multiplier. See the note on
      // `noiseMultiplier` in setup.ts before tuning this.
      const noiseMultiplier = DIFFICULTY_PROFILES[state.difficulty].noiseMultiplier
      const chosen = rng.weighted(remaining, (def) =>
        def.tags.includes('noise') ? def.weight * noiseMultiplier : def.weight,
      )
      if (!chosen) break
      fire(chosen)
    }
  }

  state.events.dailyFiredCount = result.fired.length
  return result
}
