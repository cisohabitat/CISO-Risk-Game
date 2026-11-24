import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { createIncident } from '@/game/incidents/create'
import { buildAnnualReview } from '@/game/debrief/review'
import { effortAllocation } from '@/game/debrief/prioritisation'
import { unreportedScenarios } from '@/game/risk/unreported'
import { renderDecisionText } from '@/game/decisions/describe'
import { mostPressedFunction } from '@/game/team/capacity'

// The baf4cf9 playtest (pass 10): docs/playtests/2026-11-25-owner-supplied-baf4cf9-matrix.md.
const index = testIndex()
const rngOf = (seed: string) => createRng(seed, 0)

describe('baf4cf9 playtest fixes', () => {
  it('credits a risk the player put in a board paper, as papers store it (MJ-06)', () => {
    const state = newGame(index, { seed: 'paper-prefix' })
    const missed = effortAllocation(state, index).missed!
    state.reviews.quarters.push({ quarter: 1, day: 91, topicsChosen: [`risk:${missed.id}`], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
    expect(effortAllocation(state, index).missed?.id).not.toBe(missed.id)
  })

  it('credits a risk whose route an incident took, once the player handled it (MJ-06, run 14)', () => {
    const state = newGame(index, { seed: 'incident-route' })
    const missed = effortAllocation(state, index).missed!
    const path = index.riskScenario.get(missed.id)!.attackPathIds[0]!
    const incident = createIncident(state, index, { familyId: index.content.incidentFamilies[0]!.id, pathId: path })!
    expect(effortAllocation(state, index).missed?.id).toBe(missed.id)
    incident.boardInformedDay = state.currentDay
    expect(effortAllocation(state, index).missed?.id).not.toBe(missed.id)
  })

  it('asks about a material risk the board has not heard of only when the paper would have required it (MJ-20)', () => {
    const state = newGame(index, { seed: 'material-only' })
    const id = index.content.riskScenarios[0]!.id
    applyEffects(state, [{ type: 'risk.open', scenarioId: id }], { index, rng: rngOf('m'), source: 'test' })
    const scenario = state.risks.scenarios[id]!
    scenario.lastAssessed = { ...(scenario.lastAssessed ?? {} as never), residual: 0.1, consequence: 0.1 } as never
    expect(unreportedScenarios(state).map((s) => s.id)).not.toContain(id)
    scenario.status = 'accepted'
    expect(unreportedScenarios(state).map((s) => s.id)).toContain(id)
  })

  it('names what Stop something will stop, and lifts the morale of the team it relieves (MJ-19)', () => {
    const state = newGame(index, { seed: 'stop-named' })
    const identity = index.programme.get('prog-identity')!
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: identity.id, budget: identity.budgetCost }).ok).toBe(true)
    const pressed = mostPressedFunction(state)
    const text = renderDecisionText('Stops {{stopTarget}}', state, index)
    expect(text).not.toContain('{{')
    const before = state.team.functions[pressed]!.morale
    applyEffects(state, [
      { type: 'work.stop', fn: 'most-pressed' },
      { type: 'team.morale', fn: 'most-pressed', delta: 0.12 },
    ], { index, rng: rngOf('s'), source: 'test' })
    expect(state.team.functions[pressed]!.morale).toBeGreaterThan(before)
  })

  it('records an emergency commitment in the ledger, and the close names what is owed (MJ-11)', () => {
    const state = newGame(index, { seed: 'owed' })
    state.resources.unfundedCommitment = 320
    state.currentDay = 363
    expect(buildAnnualReview(state, index).narrative.join(' ')).toContain('You end the year owing finance £320k')
  })

  it('says an attack that gave up was not seen at the time (MJ-15)', () => {
    const state = newGame(index, { seed: 'held-unseen' })
    state.currentDay = 363
    const node = Object.keys(state.organisation.nodes)[0]!
    state.threats.campaigns.push({ ...(state.threats.campaigns[0] ?? {}), id: 'camp-held', heldAt: node, detected: false } as never)
    const line = buildAnnualReview(state, index).dimensions.flatMap((d) => d.evidence).find((e) => e.includes('gave up at a control that held'))
    expect(line).toContain('not seen at the time')
  })

  it('reads objectives as the card does: missed, not failed (CS-14)', () => {
    const state = newGame(index, { seed: 'missed-word' })
    state.currentDay = 363
    state.business.objectives['obj-new-market']!.status = 'failed'
    const evidence = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'business-enablement')!.evidence.join(' ')
    expect(evidence).toContain(': missed')
    expect(evidence).not.toContain(': failed')
  })
})
