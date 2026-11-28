/**
 * Money released after an incident, scaled to the incident and to the time
 * left to spend it. It was £400k whatever happened and whenever: one player
 * took it on 30 September and ended the year with £240k unspent (427b290
 * playtest, MJ-12; owner, 28 November).
 */
import type { GameState, IncidentRuntime } from '../types'
import { YEAR_LAST_DAY } from '../time'

export function scaledPostIncidentAmount(state: GameState, base: number, incident: IncidentRuntime | undefined): number {
  // Half for a minor incident, the full amount for a material one, a quarter
  // more for a severe one.
  const size = Math.min(1.25, Math.max(0.5, 0.5 + (incident?.consequence ?? 0.5) * 1.25))
  // The full amount with half a year or more left, down to a quarter of it.
  const time = Math.min(1, Math.max(0.25, (YEAR_LAST_DAY - state.currentDay) / 182))
  return Math.round((base * size * time) / 10) * 10
}
