/**
 * Whether a targeted threat hunt could be commissioned today, and if not, why.
 * The SOC card offered "Commission a hunt" at £0 left, and the review then
 * said no hunt ran (5033820 playtest, MJ-25). The card and the review read
 * the same answer: budget and the SOC's capacity. Attention renews weekly, so
 * a week without it is not a reason the hunt was impossible.
 */
import type { ContentIndex, CyberFunction, GameState } from '../types'
import { money } from '../types'
import { availableCapacity, functionName } from '../team/capacity'

export const HUNT_ID = 'inv-threat-hunt'

export function huntBlockedReason(state: GameState, index: ContentIndex): string | undefined {
  const def = index.investigation.get(HUNT_ID)
  if (!def) return 'No targeted hunt is available.'
  if (def.budgetCost > state.resources.budgetRemaining) {
    return `A hunt costs ${money(def.budgetCost)}, more than the ${money(Math.max(0, state.resources.budgetRemaining))} left this year.`
  }
  const short = Object.entries(def.capacityPerDay).find(([fn, demand]) => (demand ?? 0) > availableCapacity(state, fn as CyberFunction))?.[0]
  if (short) return `The ${functionName(short)} team has no spare capacity for a hunt.`
  return undefined
}
