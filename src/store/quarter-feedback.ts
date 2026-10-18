import { DAYS_PER_QUARTER, type ContentIndex, type GameState } from '@/game/types'
import { plural } from '@/lib/formatting/labels'
import { openDecisions, programmeViews, teamView } from './selectors'
import type { Screen } from './game-store'

/** Recorded quarter activity and today's public concerns; never an interim annual grade. */
export function quarterFeedback(state: GameState, index: ContentIndex, quarter: number) {
  const start = (quarter - 1) * DAYS_PER_QUARTER
  const end = quarter * DAYS_PER_QUARTER
  const inQuarter = (day: number) => day >= start && day < end
  const choices = state.history.decisionsLog.filter((entry) => inQuarter(entry.day) && !state.decisions.decisions[entry.decisionId]?.resolvedByDefault)
  const lapsed = Object.values(state.decisions.decisions).filter((decision) => decision.resolvedByDefault && decision.resolvedDay !== undefined && inQuarter(decision.resolvedDay))
  const programmes = programmeViews(state, index)
  const completed = programmes.filter((programme) => {
    const day = state.programmes.programmes[programme.id]?.completedDay
    return day !== undefined && inQuarter(day)
  })
  const board = state.reviews.quarters.find((review) => review.quarter === quarter && review.completed)
  const pending = state.reviews.pendingQuarter === quarter
  const outstanding = openDecisions(state, index)
  const blocked = programmes.filter((programme) => programme.blockers.length > 0 && programme.status !== 'proposed' && programme.status !== 'complete')
  const functions = teamView(state, index).functions
  const struggling = functions.filter((fn) => fn.moraleLabel === 'Strained' || fn.moraleLabel === 'Burning out')
  const loaded = functions.filter((fn) => ['stretched', 'overloaded', 'breaking'].includes(fn.band))
  const strengths: string[] = []
  if (completed.length) strengths.push(`Delivery completed: ${completed.map((programme) => programme.shortName).join(', ')}.`)
  if (choices.length) strengths.push(`${plural(choices.length, 'choice')} recorded by you rather than left to the default. This records participation, not the quality of the choices.`)
  if (board) strengths.push(`Q${quarter} board paper submitted. ${board.boardReaction}`.trim())
  const concerns: string[] = []
  if (lapsed.length) concerns.push(`In Q${quarter}, ${plural(lapsed.length, 'decision')} lapsed: ${lapsed.map((decision) => index.decision.get(decision.defId)?.title ?? 'Recorded decision').join('; ')}.`)
  if (pending) concerns.push(`Q${quarter} board paper is awaiting your submission.`)
  else if (!board) concerns.push(`No Q${quarter} board-paper submission is recorded.`)
  if (struggling.length) concerns.push(`Morale today: ${struggling.map((fn) => `${fn.label} — ${fn.moraleLabel.toLowerCase()}`).join('; ')}.`)
  if (loaded.length) concerns.push(`Workload today: ${loaded.map((fn) => `${fn.label} — ${fn.band}`).join('; ')}.`)
  if (blocked.length) concerns.push(`Blocked today: ${blocked.map((programme) => `${programme.shortName} (${programme.blockers.map((blocker) => blocker.name).join(', ')})`).join('; ')}.`)
  const next: { text: string; label: string; screen: Screen; decisionId?: string } = outstanding[0]
    ? { text: `Review “${outstanding[0].title}”, the first decision in your deadline-ordered queue.`, label: 'Review next decision', screen: 'home', decisionId: outstanding[0].id }
    : pending
      ? { text: `Prepare the Q${quarter} paper using the material topics on the Board screen.`, label: 'Prepare board paper', screen: 'board' }
      : struggling.length || loaded.length
        ? { text: 'Review the named functions and their commitments before adding work. Pausing programmes releases people; morale recovery depends on workload and vacancies.', label: 'Review commitments', screen: 'team' }
        : blocked.length
          ? { text: 'Review the named blockers and the available interventions before committing more resources.', label: 'Review programme blockers', screen: 'programmes' }
          : { text: 'Review capacity and existing commitments before choosing the next piece of work.', label: 'Review commitments', screen: 'team' }
  return { choices, completed, board, pending, outstanding, blocked, strengths, concerns, next }
}
