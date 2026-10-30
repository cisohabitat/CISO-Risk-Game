import type { ProgrammeRuntime } from '../types'

/** Completion is a recorded status, never the result of rounding progress. */
export function programmeDeliveryPercent(programme: Pick<ProgrammeRuntime, 'status' | 'progress'>): number {
  return programme.status === 'complete' ? 100 : Math.min(99, Math.max(0, Math.round(programme.progress * 100)))
}
