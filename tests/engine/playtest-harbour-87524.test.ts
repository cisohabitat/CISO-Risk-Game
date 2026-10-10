import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { evaluateCondition } from '@/game/events/conditions'
import { tickAssumptions } from '@/game/assumptions/validation'
import { effortAllocation } from '@/game/debrief/prioritisation'
import type { AssignmentState, IncidentRuntime } from '@/game/types'
import { testIndex } from './helpers'

/**
 * From the assistant-operated session on seed harbour-87524
 * (docs/playtests/2026-10-09-ai-harbour-87524.md).
 */
describe('what the harbour-87524 session found', () => {
  it('does not record a within-tolerance assumption on a choice that accepts the restore overruns', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'harbour-87524' })
    runDays(state, index, 3)
    const runtime = openDecision(state, index, 'dec-q4-platform-resilience')!
    const taken = applyAction(state, index, {
      type: 'resolveDecision',
      decisionId: runtime.id,
      optionId: 'opt-q4-platform-accept',
      rationaleTagIds: ['rat-resources'],
    })
    expect(taken.ok, taken.message).toBe(true)
    const recorded = Object.values(state.assumptions.assumptions).filter((a) => a.linkedDecisionId === runtime.id)
    expect(recorded.map((a) => a.defId)).toEqual(['asm-platform-holds'])
    // The bet was true when made, so it can only fail by the platform going down.
    expect(recorded[0]!.heldWhenRecorded).toBe(true)
    expect(tickAssumptions(state, index).invalidated).toHaveLength(0)

    state.incidents.incidents['inc-test'] = {
      id: 'inc-test', familyId: 'fam-ransomware', startedDay: state.currentDay, phase: 'response',
      phaseEnteredDay: state.currentDay, containment: 0, recovery: 0, consequence: 0.5, dataImpact: 0,
      affectedServiceIds: ['svc-platform'], decisionsTaken: [], externalSupport: false, commandActivated: false,
    } as IncidentRuntime
    const failed = tickAssumptions(state, index).invalidated
    expect(failed.map((a) => a.wasNeverTrue)).toEqual([false])
  })

  it('does not escalate an unseen risk when every live risk has been in a paper', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'harbour-87524' })
    const event = index.content.events.find((e) => e.id === 'evt-org-board-risk-unseen')!
    const ready = () => event.conditions.every((condition) => evaluateCondition(state, index, condition))
    runDays(state, index, 3)
    for (const scenarioId of ['risk-recovery-failure', 'risk-nonprod-to-prod']) {
      expect(applyAction(state, index, { type: 'openRisk', scenarioId }).ok).toBe(true)
    }
    expect(ready()).toBe(true)
    const live = Object.values(state.risks.scenarios).filter((s) => s.status !== 'emerging' && s.status !== 'closed')
    state.reviews.quarters.push({
      quarter: 1, day: 91, topicsChosen: live.map((s) => `risk:${s.id}`), recommendationIds: [],
      uncertaintyCommunicated: true, boardReaction: '', completed: true,
    })
    expect(ready()).toBe(false)
  })

  it('counts a cloud configuration review as going near the route from non-production', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'harbour-87524' })
    // Make the non-production route the risk the year is measured against.
    const materiality = state.risks.initialMateriality!
    for (const id of Object.keys(materiality)) materiality[id] = id === 'risk-nonprod-to-prod' ? 0.9 : 0.01
    expect(effortAllocation(state, index).missed?.id).toBe('risk-nonprod-to-prod')

    const leaderId = Object.keys(state.team.leaders)[0]!
    state.team.assignments.push({
      id: 'asg-test', kind: 'investigation', refId: 'inv-cloud-review', title: 'Cloud configuration review',
      leaderId, startedDay: 0, dueDay: 20, progress: 1, capacityPerDay: {}, status: 'complete', quality: 0.6, delivered: true,
    } as AssignmentState)
    expect(effortAllocation(state, index).missed?.id).not.toBe('risk-nonprod-to-prod')
  })
})
