/**
 * Event engine (plan §23). Events are conditional story delivery, not a quiz
 * queue: an event fires when the world makes it plausible. A small number of
 * pinned events carry the campaign's narrative spine.
 */
import type { ContentIndex, GameEffect, GameEventDef, GameState } from '../types'
import { CAMPAIGN_DAYS } from '../types'
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

/**
 * A one-shot pool event gated on nothing but the calendar: colour, not
 * consequence. These are what the draw paces across the year.
 */
function isTexture(def: GameEventDef): boolean {
  return (
    def.oncePerCampaign &&
    !def.pinned &&
    !def.scheduledOnly &&
    !def.decisionId &&
    def.conditions.every((c) => c.kind === 'always' || c.kind === 'day.after' || c.kind === 'day.before')
  )
}

/**
 * Texture that reveals something — evidence, a node — is signal the player
 * forms patterns from, and holding it back costs them: paced like colour, an
 * engaged player's incidents on CISO rose from 0.93 to 1.20 a year. Signal is
 * spent faster than colour, so most of it still arrives early.
 */
function isSignal(def: GameEventDef): boolean {
  return (def.effectsOnReveal ?? []).some((e) => e.type === 'evidence.reveal' || e.type === 'node.reveal' || e.type === 'edge.reveal')
}

/**
 * How fast a reservoir is spent relative to the days left. 1 would spend it
 * exactly evenly if the draw ran every day; the draw runs on about 58% of
 * days. Colour at 1.5 lands the last of it in the fourth quarter rather than
 * leaving it unfired; signal at 3 is mostly gone by the end of the second
 * quarter, which is close to how it fell before anything was paced.
 */
const COLOUR_PACE = 1.5
const SIGNAL_PACE = 3

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
    // Texture is spent across the year, not in the first half. Measured over
    // 20 campaigns, the 68 one-shot pool events fired 30.6 / 25.5 / 2.4 / 0.3
    // per quarter, so by July the inbox had nothing left but the repeatables:
    // 60 / 55 / 27 / 23 messages a quarter from 92 / 93 / 54 / 55 subjects.
    // A one-shot that gates on nothing but the calendar is drawn with a
    // probability that keeps the unfired reservoir in step with the days
    // left, so it lasts the year; anything gated on state still fires when
    // the state arises, and a decision-opening event is never held back.
    const unfired = index.content.events.filter((def) => isTexture(def) && !state.events.firedEventIds.includes(def.id))
    const daysLeft = Math.max(1, CAMPAIGN_DAYS - state.currentDay)
    const signalChance = Math.min(1, (SIGNAL_PACE * unfired.filter(isSignal).length) / daysLeft)
    const colourChance = Math.min(1, (COLOUR_PACE * unfired.filter((def) => !isSignal(def)).length) / daysLeft)
    for (let i = 0; i < budget; i += 1) {
      let remaining = pool.filter((def) => !firedThisDay.has(def.id))
      if (remaining.some((def) => isTexture(def) && isSignal(def)) && !rng.chance(signalChance)) {
        remaining = remaining.filter((def) => !(isTexture(def) && isSignal(def)))
      }
      if (remaining.some((def) => isTexture(def) && !isSignal(def)) && !rng.chance(colourChance)) {
        remaining = remaining.filter((def) => !(isTexture(def) && !isSignal(def)))
      }
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
