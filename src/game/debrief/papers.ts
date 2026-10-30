import type { GameState } from '../types'
import { DAYS_PER_QUARTER } from '../types'

/** Count meetings, not drafts or duplicate legacy records. A window closes at
 * the following quarter boundary, including the final day of the campaign. */
export function boardPaperCounts(state: GameState) {
  const offered = Math.min(3, Math.max(0, Math.floor(state.currentDay / DAYS_PER_QUARTER)))
  const submitted = new Set(state.reviews.quarters.filter((paper) => paper.completed && paper.quarter >= 1 && paper.quarter <= offered).map((paper) => paper.quarter))
  const missed = Array.from({ length: offered }, (_, i) => i + 1).filter((quarter) => state.currentDay >= (quarter + 1) * DAYS_PER_QUARTER && !submitted.has(quarter)).length
  return { offered, submitted: submitted.size, missed, awaiting: Math.max(0, offered - submitted.size - missed) }
}
