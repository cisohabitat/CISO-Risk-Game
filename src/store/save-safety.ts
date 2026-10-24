/** Deferred validation of work that an imported campaign will execute later. */
import { z } from 'zod'
import { effectSchema } from '@/lib/schemas/content'
import { unsafeKey } from '@/game/security/references'
import type { ContentIndex, GameState } from '@/game/types'
import { validateSaveInput } from './migrations'

const key = z.string().min(1).refine((value) => !unsafeKey(value))
const returnGroup = z.string().max(256).optional()
const deferredSchema = z.object({
  difficulty: z.enum(['guided', 'ciso', 'high-pressure']),
  paused: z.boolean(), finished: z.boolean(),
  flags: z.record(key, z.union([z.number(), z.string(), z.boolean()])),
  pendingEffects: z.array(z.object({
    id: key, day: z.number().int(), source: z.string(), note: z.string().optional(),
    effects: z.array(effectSchema), returnGroup,
  })),
  events: z.object({ scheduled: z.array(z.object({
    eventId: key, day: z.number().int(), returnGroup,
    sourceYear: z.number().int().positive().optional(),
    carriedFlags: z.record(key, z.union([z.number(), z.string(), z.boolean()])).optional(),
  })) }),
})

export function saveSafety(state: GameState, index: ContentIndex): string[] {
  try { validateSaveInput(state) } catch { return ['Unsafe save structure.'] }
  if (!deferredSchema.safeParse(state).success) return ['Invalid deferred work in save.']
  const maps: Record<string, ReadonlyMap<string, unknown>> = {
    controlId: index.control, programmeId: index.programme, stakeholderId: index.stakeholder,
    nodeId: index.node, edgeId: index.edge, actorId: index.actor, objectiveId: index.objective,
    evidenceId: index.evidence, assumptionId: index.assumption, familyId: index.incidentFamily,
    pathId: index.attackPath, eventId: index.event, messageId: index.event,
    scenarioId: index.riskScenario, leaderId: index.leader, decisionId: index.decision,
  }
  for (const pending of state.pendingEffects) {
    for (const effect of pending.effects) {
      for (const [field, value] of Object.entries(effect)) {
        if (!Object.hasOwn(maps, field)) continue
        if (field === 'scenarioId' && value === 'linked') continue
        if (field === 'leaderId' && value === 'most-pressed') continue
        if (field === 'decisionId' && typeof value === 'string' && Object.hasOwn(state.decisions.decisions, value)) continue
        if (typeof value !== 'string' || !maps[field]!.has(value)) return ['Unknown deferred work target in save.']
      }
      if ('blockerId' in effect && !index.programme.get(effect.programmeId)?.blockers.some((blocker) => blocker.id === effect.blockerId)) return ['Unknown deferred blocker in save.']
    }
  }
  if (state.events.scheduled.some((event) => !index.event.has(event.eventId))) return ['Unknown scheduled event in save.']
  return []
}
