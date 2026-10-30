import type { ContentIndex, GameState } from '@/game/types'
import { minimumProgrammeFunding } from '@/game/programmes/funding'

/** Recorded selections supply provenance; current programme records supply truth.
 * Historical records do not retain dates/default status: never invent either. */
export function programmeCommitments(state: GameState, index: ContentIndex) {
  const records = [
    ...(state.previousYears ?? []).flatMap((year) => Object.entries(year.decisions).map(([defId, optionId]) => ({ id: `${year.year}:${defId}`, defId, optionId, day: undefined as number | undefined, year: year.year, historical: true }))),
    ...Object.values(state.decisions.decisions).filter((decision) => decision.resolvedDay !== undefined && !decision.resolvedByDefault).map((decision) => ({ id: decision.id, defId: decision.defId, optionId: decision.selectedOptionId, day: decision.resolvedDay, year: state.year ?? 1, historical: false })),
  ]
  const seen = new Set<string>()
  return records.reverse().flatMap((record) => {
    const definition = index.decision.get(record.defId)
    const option = definition?.options.find((item) => item.id === record.optionId)
    const promise = option?.programmeCommitment
    if (!promise || seen.has(promise.programmeId)) return []
    const def = index.programme.get(promise.programmeId)
    const work = state.programmes.programmes[promise.programmeId]
    if (!def || !work) return []
    seen.add(def.id)
    const minimum = minimumProgrammeFunding(def.budgetCost)
    const status = work.status === 'complete' ? 'Delivered' : work.status === 'proposed' ? 'Funding not arranged' : work.status === 'paused' ? 'Delivery paused' : work.blockers.some((blocker) => !blocker.resolved) ? 'Delivery blocked' : work.budgetAllocated < def.budgetCost ? 'Partially funded delivery' : 'Delivery under way'
    return [{ id: record.id, title: definition!.title, programmeId: def.id, programmeName: def.name, status, reviewDay: record.day === undefined ? undefined : record.day + promise.reviewAfterDays, year: record.year, historical: record.historical, minimum, fullCost: def.budgetCost, allocated: work.budgetAllocated, shortfall: Math.max(0, minimum - Math.max(0, state.resources.budgetRemaining)), proposed: work.status === 'proposed' }]
  })
}
