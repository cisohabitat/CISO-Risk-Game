import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { briefing } from '@/store/selectors'
import { testIndex } from './helpers'

/**
 * Concrete inconsistencies from the first observed browser playtest
 * (docs/playtests/2026-09-20-ai-browser-session.md), each verified in the
 * source before it was fixed. The tuning questions the same report raised
 * stay in docs/PLAYTEST.md.
 */
describe('what the playtest found', () => {
  it('does not remind the player about assumptions they never recorded', () => {
    const index = testIndex()
    for (const seed of ['pt-1', 'pt-2', 'pt-3']) {
      const state = newGame(index, { seed })
      for (let day = 0; day < 364; day += 1) {
        runDays(state, index, 1)
        // Answer decisions without recording assumptions against any of them.
        for (const id of [...state.decisions.openIds]) {
          const def = index.decision.get(state.decisions.decisions[id]!.defId)!
          for (const o of def.options) {
            if (o.assumptionIds?.length) continue
            if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: o.id, rationaleTagIds: [def.rationaleTagIds?.[0] ?? 'rat-more-evidence'] }).ok) break
          }
        }
      }
      expect(Object.keys(state.assumptions.assumptions)).toHaveLength(0)
      expect(state.events.firedEventIds, `${seed}: reminded about assumptions with none recorded`).not.toContain('evt-org-assumption-prompt')
    }
  })

  it('does not say the vacancies are still open after the player has recruited for them', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt-recruit' })
    runDays(state, index, 2)
    const hires = (fn: string) =>
      state.pendingEffects.filter((p) => p.effects.some((e) => e.type === 'team.vacancyFilled' && e.fn === fn)).length
    for (const fn of Object.keys(state.team.functions)) {
      const runtime = state.team.functions[fn as keyof typeof state.team.functions]!
      while (runtime.vacancies > hires(fn)) {
        const r = applyAction(state, index, { type: 'hire', fn: fn as never })
        if (!r.ok) break
      }
    }
    const stillOpen = Object.entries(state.team.functions).some(([fn, f]) => f.vacancies > hires(fn))
    expect(stillOpen, 'could not recruit for every vacancy on day 2, so the case is not arranged').toBe(false)
    runDays(state, index, 60)
    expect(state.events.firedEventIds).not.toContain('evt-org-vacancy-pressure')
  })

  it('names the function that is strained beside team capacity, and only then', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt-morale' })
    runDays(state, index, 3)
    expect(briefing(state, index).teamHealthNote).toBeUndefined()
    state.team.functions.engineering!.morale = 0.2
    expect(briefing(state, index).teamHealthNote).toBe('Engineering burning out')
  })
})
