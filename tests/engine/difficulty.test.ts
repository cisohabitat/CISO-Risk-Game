import { describe, expect, it } from 'vitest'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'
import type { Difficulty } from '@/game/types'

describe('difficulty modes', () => {
  const guided = DIFFICULTY_PROFILES.guided
  const ciso = DIFFICULTY_PROFILES.ciso
  const hard = DIFFICULTY_PROFILES['high-pressure']

  it('makes the world harsher as the mode gets harder', () => {
    for (const dial of ['threatMultiplier', 'threatTempo', 'sectorPressurePull'] as const) {
      expect(guided[dial], `${dial} should be gentlest on guided`).toBeLessThan(ciso[dial])
      expect(hard[dial], `${dial} should be harshest on high pressure`).toBeGreaterThan(ciso[dial])
    }
    // Less inherited knowledge and less executive patience, not more.
    expect(hard.startingDiscovery).toBeLessThan(ciso.startingDiscovery)
    expect(hard.executiveTolerance).toBeLessThan(ciso.executiveTolerance)
  })

  it('leaves the player the means to respond to it', () => {
    // The channels skill flows through are budget, people, attention and the
    // speed of finding things out. Cutting those alongside a harsher world is
    // what made hard mode flatter than normal rather than harder: doing well
    // stopped paying. A harder mode may tighten them; it may not gut them.
    expect(hard.budgetMultiplier).toBeGreaterThanOrEqual(ciso.budgetMultiplier * 0.85)
    expect(hard.capacityMultiplier).toBeGreaterThanOrEqual(ciso.capacityMultiplier * 0.85)
    expect(hard.focusPerWeek).toBeGreaterThanOrEqual(ciso.focusPerWeek - 1)
    expect(hard.investigationSpeed).toBeLessThanOrEqual(ciso.investigationSpeed * 1.15)
  })

  it('costs an idle player more as the mode gets harder', () => {
    const index = testIndex()
    const incidentsFor = (difficulty: Difficulty) => {
      let total = 0
      for (let i = 0; i < 24; i += 1) {
        const state = newGame(index, { seed: `diff-${i}`, difficulty })
        runDays(state, index, 364)
        total += Object.keys(state.incidents.incidents).length
      }
      return total / 24
    }
    const easy = incidentsFor('guided')
    const normal = incidentsFor('ciso')
    const hardMode = incidentsFor('high-pressure')
    expect(easy).toBeLessThan(normal)
    expect(normal).toBeLessThan(hardMode)
  })

  /**
   * "Less executive patience" is one of the things high pressure is meant to
   * keep, and it used to keep it for about seven weeks: patience drifted up
   * 0.0015 a day with no ceiling, which is +0.55 over a year against a 0.24
   * spread between the modes, so every mode finished at or near the maximum.
   * It now recovers towards the mode's own value and no further.
   */
  it('keeps executive patience describing the mode for the whole year', () => {
    const index = testIndex()
    // Averaged over seeds: what happens in one campaign is the player's year,
    // and a briefing that went well can leave an executive more patient than
    // the mode's own level, which is the dial working rather than failing.
    const patienceAt = (difficulty: Difficulty, day: number) => {
      let total = 0
      const seeds = 5
      for (let i = 0; i < seeds; i += 1) {
        const state = newGame(index, { seed: `patience-${i}`, difficulty })
        runDays(state, index, day)
        total += state.stakeholders.operationalTolerance
      }
      return total / seeds
    }
    for (const difficulty of ['guided', 'ciso', 'high-pressure'] as Difficulty[]) {
      const baseline = DIFFICULTY_PROFILES[difficulty].executiveTolerance
      const end = patienceAt(difficulty, 364)
      expect(
        Math.abs(end - baseline),
        `${difficulty} ended the year at ${end.toFixed(2)} patience, far from the ${baseline} its profile describes`,
      ).toBeLessThan(0.1)
    }
    // And the modes stay apart, rather than converging on the way.
    for (const day of [60, 200, 364]) {
      const easy = patienceAt('guided', day)
      const normal = patienceAt('ciso', day)
      const hardMode = patienceAt('high-pressure', day)
      expect(easy, `guided and ciso had converged by day ${day}`).toBeGreaterThan(normal + 0.05)
      expect(normal, `ciso and high pressure had converged by day ${day}`).toBeGreaterThan(hardMode + 0.05)
    }
  })
})
