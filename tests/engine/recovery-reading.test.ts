import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { briefing, recoveryConfidenceLabel } from '@/store/selectors'
import { testIndex } from './helpers'

/**
 * Recovery confidence read *Partial* for a player who built recovery and
 * tested it: the reading's top two bands began where no real backup estate
 * reaches. And a completed programme sat beside *Limited* with nothing to say
 * why, which three playtests read as a contradiction.
 */
describe('recovery confidence', () => {
  it('bands the range a real year produces', () => {
    expect(recoveryConfidenceLabel(0.28)).toBe('Limited') // what an untouched year inherits
    expect(recoveryConfidenceLabel(0.32)).toBe('Partial')
    expect(recoveryConfidenceLabel(0.4)).toBe('Reasonable') // built and verified
    expect(recoveryConfidenceLabel(0.6)).toBe('Strong')
  })

  it('says when recovery is built but not yet verified, and reads it once it is', () => {
    const index = testIndex()
    // A mid-range estate: verified at completion it reads 0.39. One seed in eight,
    // with backup coverage at 0.63, reads 0.35 and honestly stays Partial.
    const state = newGame(index, { seed: 'r4' })
    const idle = briefing(state, index)
    expect(idle.recoveryConfidence).toBe('Limited')
    expect(idle.recoveryNote).toBeUndefined()

    runDays(state, index, 3)
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-ransomware', budget: 700 }).ok).toBe(true)
    for (let day = 0; day < 300 && state.programmes.programmes['prog-ransomware']!.status !== 'complete'; day += 1) {
      for (const blocker of state.programmes.programmes['prog-ransomware']!.blockers) {
        if (!blocker.resolved) {
          state.resources.focusRemaining = 5
          applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: 'prog-ransomware', blockerId: blocker.id })
        }
      }
      runDays(state, index, 1)
    }
    expect(state.programmes.programmes['prog-ransomware']!.status).toBe('complete')

    const built = briefing(state, index)
    expect(built.recoveryNote).toBe('Built, but you have not checked recovery yourself since')

    applyEffects(state, [{ type: 'control.assess', controlId: 'ctl-backup' }], { index, rng: createRng(state.seed, 0), source: 'test' })
    const verified = briefing(state, index)
    expect(verified.recoveryNote).toBeUndefined()
    expect(['Reasonable', 'Strong']).toContain(verified.recoveryConfidence)
  })
})
