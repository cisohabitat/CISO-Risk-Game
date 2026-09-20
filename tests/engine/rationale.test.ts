import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { openDecisions } from '@/store/selectors'
import { CYBER_FUNCTIONS } from '@/game/types'
import { functionName, functionTitle } from '@/game/team/capacity'
import { functionLabel } from '@/lib/formatting/labels'
import { testIndex } from './helpers'

/**
 * "Residual risk is within tolerance" was recorded under "stand up incident
 * command now" and read back in the annual review, because every decision
 * offered the whole rationale vocabulary. A decision may now say which
 * reasons it can be taken for, and the engine holds it to that.
 */
describe('the reasons a decision offers', () => {
  it('are real, at least two, and exclude tolerance from the incident decisions', () => {
    const index = testIndex()
    const tagIds = new Set(index.content.rationaleTags.map((t) => t.id))
    let restricted = 0
    for (const def of index.content.decisions) {
      if (!def.rationaleTagIds) continue
      restricted += 1
      expect(def.rationaleTagIds.length, def.id).toBeGreaterThanOrEqual(2)
      for (const tagId of def.rationaleTagIds) expect(tagIds.has(tagId), `${def.id} offers unknown ${tagId}`).toBe(true)
    }
    expect(restricted).toBeGreaterThan(0)
    for (const id of ['dec-inc-command', 'dec-inc-external', 'dec-post-incident', 'dec-team-overload']) {
      const def = index.decision.get(id)!
      expect(def.rationaleTagIds, `${id} offers the whole vocabulary`).toBeDefined()
      expect(def.rationaleTagIds).not.toContain('rat-within-tolerance')
      expect(def.rationaleTagIds).not.toContain('rat-retirement')
    }
  })

  it('are enforced by the engine and carried to the dialog', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rat-1' })
    runDays(state, index, 3)
    const runtime = openDecision(state, index, 'dec-inc-command')!
    const view = openDecisions(state, index).find((d) => d.id === runtime.id)!
    expect(view.rationaleTagIds).toEqual(index.decision.get('dec-inc-command')!.rationaleTagIds)

    const refused = applyAction(state, index, {
      type: 'resolveDecision', decisionId: runtime.id, optionId: 'opt-inc-command-yes', rationaleTagIds: ['rat-within-tolerance'],
    })
    expect(refused.ok).toBe(false)
    expect(state.decisions.decisions[runtime.id]!.resolvedDay).toBeUndefined()

    const taken = applyAction(state, index, {
      type: 'resolveDecision', decisionId: runtime.id, optionId: 'opt-inc-command-yes', rationaleTagIds: ['rat-material'],
    })
    expect(taken.ok, taken.message).toBe(true)
  })
})

describe('function names', () => {
  it('come from one map, in prose and as a label', () => {
    for (const fn of CYBER_FUNCTIONS) {
      expect(functionName(fn), fn).not.toContain('-')
      expect(functionTitle(fn).charAt(0)).toBe(functionTitle(fn).charAt(0).toUpperCase())
      expect(functionLabel(fn)).toBe(functionTitle(fn))
      expect(functionTitle(fn).toLowerCase()).toBe(functionName(fn).toLowerCase())
    }
  })
})
