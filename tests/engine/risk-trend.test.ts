import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { TREND_AFTER_DAYS, visibleRisks } from '@/store/selectors'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * A finished programme moves its best risk by about a third of a band, so the
 * register a player reads barely responded to the one lever the game is built
 * around, and `describeChange` — which could have said so in words — was never
 * called. Each visible risk now says which way it has moved since it was first
 * assessed.
 */
describe('which way a risk has moved', () => {
  it('keeps the first assessment as the baseline and waits a fortnight before saying anything', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'trend-baseline' })
    runDays(state, index, 3)
    const baselines = Object.fromEntries(
      Object.values(state.risks.scenarios).map((s) => [s.id, s.firstAssessed ? { ...s.firstAssessed } : undefined]),
    )
    expect(Object.values(baselines).some(Boolean), 'nothing was assessed in three days').toBe(true)
    for (const risk of visibleRisks(state, index)) expect(risk.trend, `${risk.id} spoke after three days`).toBeUndefined()

    runDays(state, index, TREND_AFTER_DAYS + 30)
    for (const scenario of Object.values(state.risks.scenarios)) {
      if (baselines[scenario.id]) expect(scenario.firstAssessed, `${scenario.id} moved its baseline`).toEqual(baselines[scenario.id])
    }
    expect(visibleRisks(state, index).filter((r) => r.assessed).every((r) => r.trend !== undefined)).toBe(true)
  })

  it('tells an idle year its recovery risk is getting worse, and a funded one that it is holding', () => {
    const index = testIndex()
    // null: this seed never dealt the recovery risk. undefined: it did, and said nothing.
    const recoveryTrend = (seed: string, fund: boolean): string | undefined | null => {
      const state: GameState = newGame(index, { seed, difficulty: 'ciso' })
      if (!state.risks.scenarios['risk-recovery-failure']) return null
      const def = index.programme.get('prog-ransomware')!
      for (let day = 0; day < 364; day += 1) {
        if (fund && day === 5) applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
        for (const id of [...state.decisions.openIds]) {
          const decision = index.decision.get(state.decisions.decisions[id]!.defId)!
          for (const option of decision.options) {
            const tags = decision.rationaleTagIds?.slice(0, 1) ?? ['rat-within-tolerance']
            if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: tags }).ok) break
          }
        }
        for (const blocker of state.programmes.programmes[def.id]?.blockers ?? []) {
          if (!blocker.resolved) applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: def.id, blockerId: blocker.id })
        }
        runDays(state, index, 1)
      }
      return visibleRisks(state, index).find((r) => r.id === 'risk-recovery-failure')?.trend
    }

    const worse = (trend: string | undefined | null) => trend === 'worsening' || trend === 'materially worse'
    let idleWorse = 0, fundedHeld = 0, counted = 0
    for (let i = 0; i < 14; i += 1) {
      const idle = recoveryTrend(`trend-${i}`, false)
      if (idle === null) continue // this seed did not deal the recovery risk
      counted += 1
      if (worse(idle)) idleWorse += 1
      const funded = recoveryTrend(`trend-${i}`, true)
      expect(funded, `trend-${i}: the funded recovery risk said nothing about its movement`).toBeDefined()
      if (!worse(funded)) fundedHeld += 1
    }
    // Measured on these seeds: 10 of 10 worse idle, 7 of 10 holding when funded.
    expect(counted, 'too few seeds dealt the recovery risk to say anything').toBeGreaterThanOrEqual(5)
    expect(idleWorse / counted, 'an idle year was not told its recovery risk was worsening').toBeGreaterThanOrEqual(0.7)
    expect(fundedHeld / counted, 'funding recovery did not show on the recovery risk').toBeGreaterThanOrEqual(0.5)
  })
})
