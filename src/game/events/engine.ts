/**
 * Event engine (plan §23). Events are conditional story delivery, not a quiz
 * queue: an event fires when the world makes it plausible. A small number of
 * pinned events carry the campaign's narrative spine.
 */
import type { ContentIndex, GameEffect, GameEventDef, GameState } from '../types'
import { CAMPAIGN_DAYS } from '../types'
import type { Rng } from '../engine/rng'
import { evaluateAll } from './conditions'

export interface FiredEvent {
  def: GameEventDef
  effects: GameEffect[]
}

export interface EventTickResult {
  fired: FiredEvent[]
}

/**
 * A one-off report whose only effect is to tell the player things they already
 * know. An inquisitive player's own enquiries reach most findings first, and
 * the report then arrived anyway: a colleague "went looking for the last
 * recovery test report" after the player had run the test, twenty such
 * messages a year for a player who kept the team on enquiries. Repeatable
 * news and anything that also changes the world still arrives.
 */
function isRedundant(state: GameState, def: GameEventDef): boolean {
  if (!def.oncePerCampaign || def.pinned || def.decisionId || def.scheduledOnly) return false
  const effects = def.effectsOnReveal ?? []
  if (effects.length === 0) return false
  return effects.every((effect) => {
    if (effect.type === 'evidence.reveal') return state.evidence.items[effect.evidenceId] !== undefined
    if (effect.type === 'node.reveal') return state.organisation.nodes[effect.nodeId]?.discovered === true
    if (effect.type === 'edge.reveal') return state.organisation.edges[effect.edgeId]?.discovered === true
    return false
  })
}

function isEligible(state: GameState, index: ContentIndex, def: GameEventDef): boolean {
  if (state.events.suppressedEventIds.includes(def.id)) return false
  if (isRedundant(state, def)) return false
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
  // Same-tag spacing keeps the draw from clustering. It does not apply to
  // pinned beats, which carry authored days: every beat on the opening spine
  // shares the `spine` tag, so the rule queued them four days apart — the
  // CEO's "you have had one morning" landed on day 5 after a meeting that
  // "starts in 23 minutes" on day 1, and the team introduced itself on day 9.
  if (!def.pinned) {
    for (const tag of def.tags) {
      const tagDay = state.events.lastFiredDayByTag[tag]
      if (tagDay !== undefined && state.currentDay - tagDay < 4) return false
    }
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
      // A scheduled message is timed by whatever scheduled it, but it still
      // says what it says. Skipping every other check let a second incident
      // resend the first one's "once" callbacks — the invoice that asks what we
      // are buying "before the next one", after the next one — and delivered
      // messages whose conditions had stopped being true.
      if (def.oncePerCampaign && state.events.firedEventIds.includes(def.id)) continue
      if (!evaluateAll(state, index, def.conditions)) continue
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
    // A report the player has already overtaken will never be sent, so it is
    // not part of what is left to pace.
    const unfired = index.content.events.filter(
      (def) => isTexture(def) && !state.events.firedEventIds.includes(def.id) && !isRedundant(state, def),
    )
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
      // The draw used to weight `noise`-tagged events by a per-mode multiplier.
      // Both such events are repeatable on a cooldown, so they fired as often
      // as the cooldown allowed whatever the weight, and the three modes read
      // 10.73 / 10.80 / 10.67 noise messages a year. The dial is gone rather
      // than tuned: see the note in setup.ts for why noise is not the axis
      // this ladder discriminates on.
      const chosen = rng.weighted(remaining, (def) => def.weight)
      if (!chosen) break
      fire(chosen)
    }
  }

  state.events.dailyFiredCount = result.fired.length
  return result
}
