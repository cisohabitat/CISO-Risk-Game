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
    for (const dial of ['threatMultiplier', 'threatTempo', 'sectorPressurePull', 'noiseMultiplier'] as const) {
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
})
