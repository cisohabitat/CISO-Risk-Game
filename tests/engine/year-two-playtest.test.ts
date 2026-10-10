import { describe, expect, it } from 'vitest'
import { applyAction, beginNextYear, newGame, runDays } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { finishYear } from '@/game/debrief/review'
import { materialTopics } from '@/game/debrief/quarter'
import { openDecision } from '@/game/decisions/open'
import { evaluateCondition } from '@/game/events/conditions'
import { hiringUnderWay, leaderForFunction } from '@/game/team/capacity'
import { tickDay } from '@/game/engine/tick'
import { CAMPAIGN_DAYS, type GameState, type IncidentRuntime } from '@/game/types'
import { attentionLeft, shortDate } from '@/lib/formatting/labels'
import { stakeholderViews } from '@/store/selectors'
import { testIndex } from './helpers'

/**
 * What two AI playtesters found playing a second year
 * (docs/playtests/2026-10-10-ai-year-two-*.md), held.
 */
const index = testIndex()

function secondYear(seed: string, firstYear?: (state: GameState) => void): GameState {
  const state = newGame(index, { seed, difficulty: 'ciso' })
  firstYear?.(state)
  runDays(state, index, CAMPAIGN_DAYS)
  finishYear(state, index)
  return beginNextYear(index, state)
}

const effects = (state: GameState, list: Parameters<typeof applyEffects>[1]) =>
  applyEffects(state, list, { index, rng: createRng(state.seed, 7), source: 'test' })

describe('a second year that remembers the first', () => {
  const second = secondYear('y2-panel')

  it('does not offer the enquiries that only belonged to the first year', () => {
    // Late enough in the year, with the HR provider's incident on record,
    // that only the year itself keeps them closed.
    const later = JSON.parse(JSON.stringify(second)) as GameState
    later.currentDay = 120
    later.events.firedOnDay['evt-org-hr-provider-incident'] = -200
    if (!later.events.firedEventIds.includes('evt-org-hr-provider-incident')) later.events.firedEventIds.push('evt-org-hr-provider-incident')
    const firstYear = { ...later, year: 1, previousYears: [] }
    for (const id of ['inv-risk-register-review', 'inv-acquisition-dd', 'inv-hr-supplier-check']) {
      const def = index.investigation.get(id)!
      expect(evaluateCondition(firstYear, index, def.requiresCondition!), `${id} in the first year`).toBe(true)
      expect(evaluateCondition(later, index, def.requiresCondition!), id).toBe(false)
    }
  })

  it('counts a choice made last year as made', () => {
    let taken = false
    const state = secondYear('y2-retention', (first) => {
      // Answered when it arrives, as a player would.
      while (!taken && first.currentDay < CAMPAIGN_DAYS) {
        runDays(first, index, 1)
        const id = first.decisions.openIds.find((open) => first.decisions.decisions[open]!.defId === 'dec-data-retention')
        if (!id) continue
        taken = applyAction(first, index, {
          type: 'resolveDecision', decisionId: id, optionId: 'opt-retention-delete', rationaleTagIds: ['rat-regulatory'],
        }).ok
      }
    })
    expect(taken, 'the retention decision never arrived on this seed').toBe(true)
    expect(Object.values(state.decisions.decisions).some((d) => d.defId === 'dec-data-retention')).toBe(false)
    expect(
      evaluateCondition(state, index, { kind: 'decision.optionTaken', decisionId: 'dec-data-retention', optionId: 'opt-retention-delete' }),
    ).toBe(true)
  })

  it('names the second Kestrel objective as a stage of its own', () => {
    const kestrel = index.content.objectives.find((o) => o.id === 'obj-y2-kestrel')!
    expect(kestrel.name).not.toMatch(/bring kestrel onto/i)
    expect(kestrel.description).toMatch(/^Last year joined/)
  })

  it('gives executives this year’s worries and priorities, not the launch year’s', () => {
    const priya = second.stakeholders.stakeholders['stk-digital']!
    expect(priya.concerns).not.toContain('Anything that delays the launch')
    const view = stakeholderViews(second, index).find((s) => s.id === 'stk-digital')!
    expect(view.priorities).not.toContain('Platform launch')
  })

  it('does not ask for the same decision twice when the risk is answered on the Risk screen', () => {
    const state = JSON.parse(JSON.stringify(second)) as GameState
    const scenarioId = Object.keys(state.risks.scenarios)[0]!
    const runtime = openDecision(state, index, 'dec-acceptance-renewal', { scenarioId, deadlineDays: 14 })!
    const accepted = applyAction(state, index, {
      type: 'acceptRisk', scenarioId, rationaleTagIds: ['rat-within-tolerance'], days: 90, assumptionDefIds: [],
    })
    expect(accepted.ok, accepted.message).toBe(true)
    expect(state.decisions.openIds).not.toContain(runtime.id)
    expect(state.decisions.decisions[runtime.id]!.selectedOptionId).toBe('opt-renewal-renew')
    expect(state.decisions.decisions[runtime.id]!.resolvedByDefault).toBe(false)
    runDays(state, index, 20)
    expect(state.risks.scenarios[scenarioId]!.status).toBe('accepted')
  })
})

describe('the board and a reported incident', () => {
  it('does not count a closed incident it has already been told about as missing from the paper', () => {
    const state = newGame(index, { seed: 'y2-board' })
    state.incidents.incidents['inc-1'] = {
      id: 'inc-1', familyId: index.content.incidentFamilies[0]!.id, startedDay: 5, phase: 'closed', phaseEnteredDay: 20,
      containment: 1, recovery: 1, consequence: 0.3, dataImpact: 0, affectedServiceIds: [], decisionsTaken: [],
      externalSupport: false, commandActivated: false,
    } as IncidentRuntime
    expect(materialTopics(state, index).find((t) => t.id === 'incident:inc-1')!.material).toBe(true)
    state.reviews.quarters.push({
      quarter: 1, day: 91, topicsChosen: ['incident:inc-1'], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true,
    })
    expect(materialTopics(state, index).find((t) => t.id === 'incident:inc-1')!.material).toBe(false)
  })
})

describe('the team', () => {
  it('sends engineering’s overload from the head of engineering', () => {
    expect(leaderForFunction(index, 'engineering')).toBe('lead-eng')
  })

  it('opens a post when somebody resigns, and stops reading "Recruiting" once the hire joins', () => {
    const state = newGame(index, { seed: 'y2-team' })
    const soc = state.team.functions.soc!
    const before = { capacity: soc.capacity, vacancies: soc.vacancies }
    effects(state, [{ type: 'team.departure', fn: 'soc' }])
    expect(soc.capacity).toBe(before.capacity - 1)
    expect(soc.vacancies).toBe(before.vacancies + 1)
    expect(applyAction(state, index, { type: 'hire', fn: 'soc' }).ok).toBe(true)
    expect(hiringUnderWay(state, 'soc')).toBe(true)
    runDays(state, index, 61)
    expect(hiringUnderWay(state, 'soc')).toBe(false)
    expect(soc.vacancies).toBe(before.vacancies)
  })

  it('stops the clock when a programme is blocked', () => {
    const state = newGame(index, { seed: 'y2-blocked' })
    const def = index.programme.get('prog-identity')!
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok).toBe(true)
    const chances = def.blockers.map((blocker) => blocker.chancePerDay)
    for (const blocker of def.blockers) blocker.chancePerDay = 1
    try {
      const result = tickDay(state, index)
      expect(result.pauseReasons).toContain('programme-blocked')
    } finally {
      // The index is shared by every test in the file.
      def.blockers.forEach((blocker, i) => (blocker.chancePerDay = chances[i]!))
    }
  })
})

describe('the words around the year', () => {
  it('dates last year’s things as last year’s', () => {
    expect(shortDate(-30)).toBe('last year')
    expect(shortDate(0)).toBe('1 Jan')
  })

  it('says what a week holds when a decision has given it more than five', () => {
    expect(attentionLeft(3, 5)).toBe('3 of 5 left')
    expect(attentionLeft(6, 5)).toBe('5 of 5 left, and 1 extra')
    expect(attentionLeft(6, 5, true)).toBe('5/5 +1')
  })
})
