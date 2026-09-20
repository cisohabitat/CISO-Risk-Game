import { describe, expect, it } from 'vitest'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

/**
 * A decision the player did not answer is decided for them, and the review
 * holds it against them. Found by playing a year by hand: the CEO's "three
 * risks" lapsed on day 6 to "talk in general terms", and between day 6 and day
 * 18 the inbox carried seven messages and not one of them said so. The only
 * record was a history line in a four-item list that had already rolled off.
 */
describe('a lapsed decision', () => {
  it('is told to the player in their inbox, naming what was chosen for them', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'lapse-1' })
    // Answer nothing. Everything with a deadline lapses.
    runDays(state, index, 120)

    const lapsed = Object.values(state.decisions.decisions).filter((d) => d.resolvedByDefault)
    expect(lapsed.length, 'nothing lapsed in 120 idle days — the assertion never ran').toBeGreaterThan(0)

    for (const decision of lapsed) {
      const def = index.decision.get(decision.defId)!
      const chosen = def.options.find((o) => o.id === decision.selectedOptionId)!
      const notice = state.inbox.messages.find(
        (m) => m.decisionId === decision.id && /decided without you/i.test(m.subject),
      )
      expect(notice, `${def.title} lapsed on day ${decision.resolvedDay} and the inbox never said so`).toBeDefined()
      expect(notice!.day).toBe(decision.resolvedDay)
      // It says what the organisation actually did, in the option's own words.
      expect(notice!.body).toContain(chosen.label)
      // And it is not filed as routine: it changed something with your name on it.
      expect(['urgent', 'critical']).toContain(notice!.priority)
    }
  })

  it('sends nothing when the player answered in time', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'lapse-2' })
    runDays(state, index, 3)
    // Nothing has had time to lapse; no notice should exist.
    expect(state.inbox.messages.some((m) => /decided without you/i.test(m.subject))).toBe(false)
  })
})
