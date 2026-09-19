/**
 * Simulation soak tests (plan §42.3). A simulation can look fine and still
 * produce incoherent state, deadlocks or runaway event volume, so these run
 * many seeded campaigns under several policies and assert the outcome
 * distribution stays inside sane bounds.
 */
import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { checkInvariants } from '@/game/engine/invariants'
import { testIndex } from './helpers'
import type { ContentIndex, Difficulty, GameState } from '@/game/types'

type Policy = 'passive' | 'defensive' | 'business'

function playCampaign(index: ContentIndex, seed: string, policy: Policy, difficulty: Difficulty): GameState {
  const state = newGame(index, { seed, difficulty })
  const wanted =
    policy === 'defensive'
      ? ['prog-identity', 'prog-ransomware', 'prog-detection', 'prog-segmentation']
      : policy === 'business'
        ? ['prog-cloud']
        : []
  let started = 0
  for (let day = 0; day < 364; day += 1) {
    for (const decisionId of [...state.decisions.openIds]) {
      const decision = state.decisions.decisions[decisionId]
      const def = decision ? index.decision.get(decision.defId) : undefined
      const option = def?.options[policy === 'defensive' ? def.options.length - 1 : 0]
      if (!option) continue
      applyAction(state, index, {
        type: 'resolveDecision',
        decisionId,
        optionId: option.id,
        rationaleTagIds: ['rat-within-tolerance'],
      })
    }
    if (started < wanted.length && day % 25 === 0) {
      const programmeId = wanted[started]!
      const def = index.programme.get(programmeId)
      if (def && state.resources.budgetRemaining > def.budgetCost) {
        if (applyAction(state, index, { type: 'startProgramme', programmeId, budget: def.budgetCost }).ok) {
          started += 1
        }
      }
    }
    if (policy !== 'passive' && day % 11 === 0) {
      for (const investigation of index.content.investigations) {
        if (
          applyAction(state, index, {
            type: 'startInvestigation',
            investigationId: investigation.id,
            leaderId: index.content.leaders[day % index.content.leaders.length]!.id,
          }).ok
        ) {
          break
        }
      }
    }
    runDays(state, index, 1)
  }
  return state
}

describe('simulation soak', () => {
  it('runs 60 seeded campaigns without crashing or breaking an invariant', () => {
    const index = testIndex()
    const policies: Policy[] = ['passive', 'defensive', 'business']
    const difficulties: Difficulty[] = ['guided', 'ciso', 'high-pressure']
    let incidentTotal = 0
    let campaigns = 0
    let eventTotal = 0
    let somethingHappened = 0

    for (let seedIndex = 0; seedIndex < 20; seedIndex += 1) {
      for (const policy of policies) {
        const difficulty = difficulties[seedIndex % difficulties.length]!
        const state = playCampaign(index, `soak-${seedIndex}`, policy, difficulty)
        campaigns += 1

        expect(checkInvariants(state, index), `seed soak-${seedIndex} / ${policy}`).toEqual([])
        expect(state.currentDay).toBe(364)
        expect(Number.isFinite(state.resources.budgetRemaining)).toBe(true)

        const incidents = Object.values(state.incidents.incidents)
        incidentTotal += incidents.length
        eventTotal += state.events.firedEventIds.length

        // No campaign should be a runaway: constant incidents is as broken as none.
        expect(incidents.length).toBeLessThanOrEqual(6)
        // Nor a deadlock: something must have happened.
        const meaningful =
          state.evidence.order.length > 3 ||
          state.history.decisionsLog.length > 3 ||
          incidents.length > 0
        if (meaningful) somethingHappened += 1
        // Event volume must not explode.
        expect(state.events.firedEventIds.length).toBeLessThanOrEqual(index.content.events.length)
        // The player must never be buried under unanswerable decisions.
        expect(state.decisions.openIds.length).toBeLessThanOrEqual(8)
      }
    }

    expect(somethingHappened).toBe(campaigns)
    const averageIncidents = incidentTotal / campaigns
    expect(averageIncidents).toBeGreaterThan(0.1)
    expect(averageIncidents).toBeLessThan(3)
    expect(eventTotal / campaigns).toBeGreaterThan(25)
  })

  it('makes stronger controls reduce incident consequence across many seeds', () => {
    const index = testIndex()
    let weakConsequence = 0
    let strongConsequence = 0
    let strongIncidents = 0
    let weakIncidents = 0

    for (let i = 0; i < 12; i += 1) {
      const seed = `compare-${i}`
      const weak = newGame(index, { seed })
      const strong = newGame(index, { seed })
      // The only difference between the two worlds is the state of the controls
      // the CISO inherited, so any divergence is attributable to them.
      for (const control of Object.values(strong.controls.controls)) {
        control.coverage = 0.92
        control.configurationQuality = 0.88
        control.operationalEffectiveness = 0.88
        control.monitoringQuality = 0.85
        control.exceptionRate = 0.05
      }
      runDays(weak, index, 364)
      runDays(strong, index, 364)
      weakIncidents += Object.values(weak.incidents.incidents).length
      strongIncidents += Object.values(strong.incidents.incidents).length
      weakConsequence += Object.values(weak.incidents.incidents).reduce((sum, inc) => sum + inc.consequence, 0)
      strongConsequence += Object.values(strong.incidents.incidents).reduce((sum, inc) => sum + inc.consequence, 0)
    }

    expect(strongConsequence).toBeLessThan(weakConsequence)
    expect(strongIncidents).toBeLessThan(weakIncidents)
  })

  it('does not guarantee a clean year even with strong controls', () => {
    // Good decisions do not guarantee good outcomes (plan §2.5).
    const index = testIndex()
    let incidentsWithStrongControls = 0
    for (let i = 0; i < 25; i += 1) {
      const state = newGame(index, { seed: `luck-${i}`, difficulty: 'high-pressure' })
      for (const control of Object.values(state.controls.controls)) {
        control.coverage = 0.9
        control.configurationQuality = 0.85
        control.operationalEffectiveness = 0.85
        control.exceptionRate = 0.05
      }
      runDays(state, index, 364)
      incidentsWithStrongControls += Object.values(state.incidents.incidents).length
    }
    expect(incidentsWithStrongControls).toBeGreaterThan(0)
  })
})
