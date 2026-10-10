import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildReconstruction } from '@/game/incidents/engine'
import { delegationOutlook, leaderAsAssigned, teamStrain } from '@/game/team/capacity'
import type { IncidentRuntime } from '@/game/types'
import { testIndex } from './helpers'

/**
 * What the AI playtest panel of 9 October 2026 found in the engine
 * (docs/playtests/2026-10-09-ai-panel-*.md), held.
 */
const index = testIndex()

describe('the board paper', () => {
  it('leaves the committee’s reading in the inbox, not only in a toast', () => {
    const state = newGame(index, { seed: 'panel-board' })
    while (state.reviews.pendingQuarter === undefined) runDays(state, index, 1)
    const result = applyAction(state, index, {
      type: 'completeQuarterReview', quarter: state.reviews.pendingQuarter, topics: [], recommendations: [], communicateUncertainty: true,
    })
    expect(result.ok).toBe(true)
    const kept = state.inbox.messages.find((m) => m.subject === 'The committee on your Q1 paper')
    expect(kept?.body).toBe(result.message)
  })
})

describe('the commission dialog', () => {
  it('counts the work a lead already holds, and the work being offered', () => {
    const state = newGame(index, { seed: 'panel-phone', difficulty: 'guided' })
    const lead = state.team.leaders['lead-eng']!
    const enquiries = index.content.investigations.filter((i) => !i.requiresCondition).slice(0, 3)
    const said: string[] = []
    for (const enquiry of enquiries) {
      said.push(delegationOutlook(leaderAsAssigned(state, state.team.leaders['lead-eng']!, enquiry.capacityPerDay), teamStrain(state)))
      applyAction(state, index, { type: 'startInvestigation', investigationId: enquiry.id, leaderId: 'lead-eng' })
    }
    // Three to one lead on one morning: the dialog no longer says "room" to the last of them.
    expect(said.at(-1)).not.toBe('room')
    expect(said.at(-1)).not.toBe(delegationOutlook(lead, teamStrain(state)))
  })
})

describe('the reconstruction', () => {
  it('reads detection from when the intrusion began, and counts the warnings it raised', () => {
    const state = newGame(index, { seed: 'panel-recon' })
    const path = index.content.attackPaths[0]!
    state.threats.campaigns.push({
      id: 'c-long', actorId: index.content.actors[0]!.id, pathId: path.id, stage: 'impact', stepIndex: 0,
      stepProgress: 0, startedDay: 10, lastAdvanceDay: 60, detected: false, disrupted: false, evidenceRaisedIds: [],
    } as never)
    state.flags['signal.c-long.foothold'] = true
    state.flags['signal.c-long.lateral-movement'] = true
    const incident = {
      id: 'i-1', familyId: index.content.incidentFamilies[0]!.id, campaignId: 'c-long', pathId: path.id, startedDay: 60,
      phase: 'closed', phaseEnteredDay: 70, containment: 1, recovery: 1, consequence: 0.3, dataImpact: 0, affectedServiceIds: [],
      decisionsTaken: [], detectionDay: 60, externalSupport: false, commandActivated: false,
    } as IncidentRuntime
    const rebuilt = buildReconstruction(state, index, incident)
    expect(rebuilt.helped).not.toContain('The activity was detected almost immediately')
    expect(rebuilt.hurt.join(' ')).toContain('raised 2 warnings over 7 weeks before it reached the business')
  })
})

describe('what an enquiry says it found', () => {
  it('names systems, dependencies and controls it reached, not only evidence', async () => {
    const { enquiryFindings } = await import('@/game/team/findings')
    const state = newGame(index, { seed: 'panel-findings' })
    const node = Object.values(state.organisation.nodes).find((n) => n.exists && !n.discovered)!
    const words = enquiryFindings(state, index, {
      evidenceIds: [], nodeIds: [node.id], edgeIds: [], controlIds: ['ctl-backup'],
    })
    expect(words).toContain(`It found a system you had not mapped: ${index.node.get(node.id)!.name}.`)
    expect(words).toContain('It assessed backup and recovery')
    expect(words).not.toContain('found nothing new')
  })

  it('names what it confirmed when nothing else came back', async () => {
    const { enquiryFindings } = await import('@/game/team/findings')
    const state = newGame(index, { seed: 'panel-findings' })
    const known = 'ev-legacy-inventory'
    state.evidence.items[known] = { id: known, discoveredDay: 1, sourceLabel: 'test', read: true, archived: false, linkedHypothesisIds: [] }
    const words = enquiryFindings(state, index, { evidenceIds: [known], nodeIds: [], edgeIds: [], controlIds: [] })
    expect(words).toBe(` It confirmed what you already had (${index.evidence.get(known)!.title}) and found nothing new.`)
  })
})

describe('messages that contradict what the player established', () => {
  it('does not say Corvus’s claim is untested once the player’s own review has disproved it', async () => {
    const { evaluateCondition } = await import('@/game/events/conditions')
    const state = newGame(index, { seed: 'panel-corvus' })
    const ready = (id: string) =>
      index.content.events.find((e) => e.id === id)!.conditions.every((c) => evaluateCondition(state, index, c))
    expect(ready('evt-org-supplier-questionnaire')).toBe(true)
    expect(ready('evt-org-supplier-questionnaire-known')).toBe(false)
    state.evidence.items['ev-msp-no-mfa'] = { id: 'ev-msp-no-mfa', discoveredDay: 1, sourceLabel: 'test', read: true, archived: false, linkedHypothesisIds: [] }
    expect(ready('evt-org-supplier-questionnaire')).toBe(false)
    expect(ready('evt-org-supplier-questionnaire-known')).toBe(true)
  })
})
