/**
 * Creating decision instances. A decision definition may be opened more than
 * once across a campaign (e.g. a recurring supplier exception), so instances
 * carry their own id and the definition id they came from.
 */
import type { ContentIndex, DecisionRuntime, GameState } from '../types'

export function openDecision(
  state: GameState,
  index: ContentIndex,
  defId: string,
  options: { eventId?: string; deadlineDays?: number; scenarioId?: string } = {},
): DecisionRuntime | undefined {
  const def = index.decision.get(defId)
  if (!def) return undefined
  // Never stack an identical unresolved decision on the player.
  const existing = state.decisions.openIds
    .map((id) => state.decisions.decisions[id])
    .find((d) => d && d.defId === defId)
  if (existing) return existing

  state.decisions.counter += 1
  const id = `dec-${state.decisions.counter}`
  const deadlineDays = options.deadlineDays ?? def.deadlineDays
  const runtime: DecisionRuntime = {
    id,
    defId,
    eventId: options.eventId,
    createdDay: state.currentDay,
    deadlineDay: deadlineDays === undefined ? undefined : state.currentDay + deadlineDays,
    resolvedByDefault: false,
    rationaleTagIds: [],
    assumptionIds: [],
    scenarioId: options.scenarioId,
  }
  state.decisions.decisions[id] = runtime
  state.decisions.openIds.push(id)
  return runtime
}

export function openDecisionCount(state: GameState): number {
  return state.decisions.openIds.length
}
