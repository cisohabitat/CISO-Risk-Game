import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview } from '@/game/debrief/review'
import { effortAllocation } from '@/game/debrief/prioritisation'
import { openDecision } from '@/game/decisions/open'
import { testIndex } from './helpers'

/**
 * Two lines of the annual review that contradicted the New money playtest's
 * own decision record (docs/playtests/2026-09-29-ai-new-money.md).
 */
describe('the close against what the player chose', () => {
  it('counts a restore into the test tenancy as recovery exercised', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt5-restore' })
    runDays(state, index, 270)
    const runtime = openDecision(state, index, 'dec-q4-recovery-window')!
    const taken = applyAction(state, index, { type: 'resolveDecision', decisionId: runtime.id, optionId: 'opt-q4-recovery-nonprod', rationaleTagIds: ['rat-disproportionate'] })
    expect(taken.ok, taken.message).toBe(true)
    runDays(state, index, 364 - state.currentDay)
    const resilience = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'resilience')!
    const evidence = resilience.evidence.join(' | ')
    expect(evidence).not.toContain('Recovery was never exercised')
    expect(evidence).toContain('a restore into the test tenancy')
  })

  it('says when the year could no longer pay for what it offered', () => {
    const index = testIndex()
    const broke = newGame(index, { seed: 'pt5-broke' })
    runDays(broke, index, 110)
    broke.resources.budgetRemaining = 0
    // The SOC renewal offers a £140k rewrite and a £60k replacement.
    const renewal = openDecision(broke, index, 'dec-soc-contract')!
    expect(renewal.pricedOutOptionIds?.length).toBeGreaterThan(0)
    runDays(broke, index, 364 - broke.currentDay)
    const line = buildAnnualReview(broke, index).narrative.find((text) => text.includes('could no longer pay for'))
    expect(line).toMatch(/^From .+, the year offered things the budget could no longer pay for: (one decision|\d+ decisions) held an option out of reach\.$/)

    // A year that never ran short hears nothing of it.
    const flush = newGame(index, { seed: 'pt5-flush' })
    flush.resources.budgetRemaining = 100_000
    runDays(flush, index, 364)
    expect(buildAnnualReview(flush, index).narrative.join(' ')).not.toContain('could no longer pay for')
  })

  it('does not say nothing went near the acquisition after the join was refused', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt5-kestrel' })
    runDays(state, index, 3)
    // Everything funded except what treats the acquisition, so that it is the
    // largest risk left untouched, as it was in the playtest.
    state.resources.budgetRemaining = 10_000
    for (const def of index.content.programmes) {
      if (['prog-segmentation', 'prog-thirdparty'].includes(def.id)) continue
      state.resources.focusRemaining = 5
      const built = applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
      expect(built.ok, built.message).toBe(true)
    }
    runDays(state, index, 5)
    const before = effortAllocation(state, index)
    expect(before.missed?.id).toBe('risk-acquisition-integration')
    const runtime = openDecision(state, index, 'dec-acquisition-integration')!
    const taken = applyAction(state, index, { type: 'resolveDecision', decisionId: runtime.id, optionId: 'opt-acq-delay', rationaleTagIds: ['rat-more-evidence'] })
    expect(taken.ok, taken.message).toBe(true)
    const after = effortAllocation(state, index)
    // The refusal changes no node, so only the decision's subject can carry it.
    expect(after.missed?.id).not.toBe('risk-acquisition-integration')
    // And it is a claim about what was done, not a change to the score.
    expect(after.allocation).toBe(before.allocation)
  })
})
