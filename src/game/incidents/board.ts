/**
 * The board hears about incidents (owner, 19 November). Board confidence moved
 * only with papers and decisions, so a ransomware year left it where a quiet
 * one did, and testers read that as a bug. It does not react to luck: it
 * reacts to how it was told. Briefed within days, warned in an earlier paper
 * of the route, it holds; hearing elsewhere first, or about a route nobody
 * put in front of it, it does not.
 */
import type { ContentIndex, GameEffect, GameState, IncidentFamilyDef, IncidentRuntime } from '../types'
import { BOARD_BRIEFING_DAYS, BOARD_MATERIAL, BOARD_REGULATORY } from './thresholds'

export const BOARD_CHAIR = 'Sir Alan Whitcombe, Chair, Board Risk Committee'
const HEARD_ELSEWHERE = -0.06
const BRIEFED_EARLY = 0.02
/**
 * Reassurance is a wager: a little more than candour when the incident stays
 * small, and a cost when the board was told it was in hand and it was not.
 */
const REASSURANCE_HELD = 0.03
const REASSURANCE_FAILED = -0.05
/** How long the board is slow to warm again after a material incident closes. */
const BOARD_WARY_DAYS = 91

export interface BoardLetter { subject: string; body: string }

export function boardWorthy(incident: IncidentRuntime, family: IncidentFamilyDef): boolean {
  return incident.consequence >= BOARD_MATERIAL || family.regulatoryInterest >= BOARD_REGULATORY
}

/** Phases in which a briefing is news: confirmed, and not yet written up.
 * The response phase was missing, so an incident that sat in it past the
 * three days offered no briefing and was then marked "heard elsewhere"
 * (57c9605 playtest, MJ-33). */
export function canBriefBoard(incident: IncidentRuntime): boolean {
  return incident.boardInformedDay === undefined && ['escalation', 'response', 'containment', 'consequence', 'recovery'].includes(incident.phase)
}

/** Briefed within the window, and before the board heard elsewhere. */
export function briefedInTime(incident: IncidentRuntime): boolean {
  if (incident.boardInformedDay === undefined || incident.boardHeardElsewhereDay !== undefined) return false
  // Late by the date as well: an incident the board never heard of elsewhere
  // was still thanked for coming "early" three days past its deadline
  // (16fe0ee playtest, m-24).
  return incident.responseStartedDay === undefined || incident.boardInformedDay <= incident.responseStartedDay + BOARD_BRIEFING_DAYS
}

/** The paper, if any, that put this incident's route in front of the board before it happened. */
function warnedIn(state: GameState, index: ContentIndex, incident: IncidentRuntime): number | undefined {
  if (!incident.pathId) return undefined
  const risks = index.content.riskScenarios.filter((risk) => risk.attackPathIds.includes(incident.pathId!)).map((risk) => `risk:${risk.id}`)
  return state.reviews.quarters
    .filter((paper) => paper.completed && paper.day < incident.startedDay && paper.topicsChosen.some((topic) => risks.includes(topic)))
    .map((paper) => paper.quarter)
    .sort((a, b) => a - b)[0]
}

/** Three days into a response nobody has briefed, the board hears elsewhere. */
export function boardHearsElsewhere(state: GameState, incident: IncidentRuntime, family: IncidentFamilyDef): { effects: GameEffect[]; letter: BoardLetter } | undefined {
  if (incident.responseStartedDay === undefined || incident.boardInformedDay !== undefined || incident.boardHeardElsewhereDay !== undefined) return undefined
  if (state.currentDay - incident.responseStartedDay < BOARD_BRIEFING_DAYS || !boardWorthy(incident, family)) return undefined
  incident.boardHeardElsewhereDay = state.currentDay
  return {
    effects: [{ type: 'board.confidence', delta: HEARD_ELSEWHERE }],
    letter: {
      subject: `The committee heard about the ${family.name.toLowerCase()} elsewhere`,
      body: 'The committee heard about this incident from the Chief Executive’s office before it heard from you. Whatever the facts turn out to be, the board expects the first account to come from its CISO. Brief us on what is known and what is not.',
    },
  }
}

/** The committee's reading once an incident closes. */
export function boardOnClose(state: GameState, index: ContentIndex, incident: IncidentRuntime, family: IncidentFamilyDef): { effects: GameEffect[]; letter: BoardLetter } | undefined {
  const material = incident.consequence >= BOARD_MATERIAL
  const told = briefedInTime(incident)
  if (!material && !(told && boardWorthy(incident, family))) return undefined
  const effects: GameEffect[] = []
  const lines: string[] = []
  if (material) {
    effects.push({ type: 'board.wary', days: BOARD_WARY_DAYS })
    const warned = warnedIn(state, index, incident)
    const cost = 0.06 + 0.14 * Math.min(1, (incident.consequence - BOARD_MATERIAL) / (1 - BOARD_MATERIAL))
    effects.push({ type: 'board.confidence', delta: -(warned !== undefined ? cost * 0.6 : cost) })
    lines.push('The committee has reviewed what the incident cost the business.')
    lines.push(warned !== undefined
      ? `Your Q${warned} paper had put this route in front of it, so it reads this as a risk it knew it was carrying.`
      : 'Nothing in your papers had put this route in front of it, and it asks why it was not.')
  } else {
    lines.push('The committee notes that the incident was contained before it cost the business much.')
  }
  if (told && incident.boardBriefingTone === 'reassuring') {
    effects.push({ type: 'board.confidence', delta: material ? REASSURANCE_FAILED : REASSURANCE_HELD })
    lines.push(material
      ? 'It heard about it from you first, but it was told the incident was in hand, and it was not.'
      : 'It heard about it from you first, and your reassurance held.')
  } else if (told) {
    effects.push({ type: 'board.confidence', delta: BRIEFED_EARLY })
    lines.push('It heard about it from you first, with what was known and what was not, which is what it needed.')
  } else if (incident.boardHeardElsewhereDay !== undefined) {
    lines.push('It heard about it elsewhere first, and has not forgotten that.')
  } else if (incident.boardInformedDay !== undefined) {
    lines.push('It heard about it from you, later than it expected to.')
  }
  return { effects, letter: { subject: `The committee on the ${family.name.toLowerCase()}`, body: lines.join(' ') } }
}
