import type { ContentIndex, GameState } from '../types'

/** A conditional projection of public progress, not hidden health or an annual grade. */
export function objectivePace(state: GameState, index: ContentIndex, objectiveId: string) {
  const runtime = state.business.objectives[objectiveId]
  const def = index.objective.get(objectiveId)
  if (!runtime || !def || !['active', 'at-risk'].includes(runtime.status)) return undefined
  const sampleDays = state.currentDay - Math.round(def.targetDay * 0.12) + 1
  const daysRemaining = runtime.targetDay - state.currentDay
  if (sampleDays < 7 || daysRemaining <= 0) return undefined
  const projectedProgress = runtime.progress + runtime.progress / sampleDays * daysRemaining
  return { daysRemaining, sampleDays, atRisk: projectedProgress + 1e-6 < 1 }
}
