/**
 * Shared bits of "how a simulated player behaves" for the offline harnesses.
 *
 * These exist so the harnesses measure the game rather than an artefact of how
 * the script drives it. The first version of every loop commissioned the first
 * investigation that would start, which is always the same repeatable one near
 * the top of the content file — so the harnesses reported a player who ran one
 * threat hunt ninety times and never opened the other seventeen.
 */
import { applyAction } from '../src/game/engine/orchestrator'
import { materialTopics } from '../src/game/debrief/review'
import type { ContentIndex, GameState, InvestigationDef } from '../src/game/types'

export function leastCommissioned(
  index: ContentIndex,
  commissioned: Record<string, number>,
): InvestigationDef[] {
  return [...index.content.investigations].sort(
    (a, b) => (commissioned[a.id] ?? 0) - (commissioned[b.id] ?? 0),
  )
}

/**
 * Prepare the board pack when a quarter closes, covering the material items.
 *
 * Harnesses that skip this measure a CISO who never went to the board, which
 * reads as a communication failure that no play could avoid.
 */
export function completeQuarterIfDue(state: GameState, index: ContentIndex): boolean {
  const quarter = state.reviews.pendingQuarter
  if (quarter === undefined) return false
  const topics = materialTopics(state, index)
    .filter((topic) => topic.material)
    .map((topic) => topic.id)
  return applyAction(state, index, {
    type: 'completeQuarterReview',
    quarter,
    topics,
    recommendations: [],
    communicateUncertainty: true,
  }).ok
}
