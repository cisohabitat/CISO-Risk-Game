import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { enquirySpeaksTo, visibleRisks } from '@/store/selectors'
import { ENQUIRY_THEMES } from '@/game/types'
import { testIndex } from './helpers'

/**
 * The opening playtest's newcomers could not connect a risk card to an
 * enquiry. Each enquiry now says which of the player's risks it speaks to,
 * and only those: naming a scenario the player has not met would hand them
 * hidden truth.
 */
describe('what an enquiry speaks to', () => {
  it('names only risks the player has, and groups every enquiry under a question', () => {
    const index = testIndex()
    const themes = new Set(ENQUIRY_THEMES.map((t) => t.id))
    for (const def of index.content.investigations) expect(themes.has(def.theme), `${def.id} has no question`).toBe(true)

    const state = newGame(index, { seed: 'speaks-1' })
    runDays(state, index, 3)
    const before = enquirySpeaksTo(state, index, 'inv-recovery-test')
    for (const r of before) expect(state.risks.scenarios[r.id], `${r.id} named but not on the list`).toBeDefined()

    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-recovery-failure' })
    const after = enquirySpeaksTo(state, index, 'inv-recovery-test')
    expect(after.map((r) => r.id)).toContain('risk-recovery-failure')
    // The team review speaks to no authored risk; it says nothing rather than something false.
    expect(enquirySpeaksTo(state, index, 'inv-team-review')).toEqual([])

    // A broad enquiry speaks to several risks and the card names three of
    // them, so they come in the order the player's own list ranks them.
    const ranked = visibleRisks(state, index).map((r) => r.id)
    const broad = enquirySpeaksTo(state, index, 'inv-architecture-review').map((r) => r.id)
    expect(broad.length).toBeGreaterThan(1)
    expect(broad).toEqual(ranked.filter((id) => broad.includes(id)))
  })
})
