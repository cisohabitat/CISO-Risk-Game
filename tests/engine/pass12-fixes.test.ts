import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { buildReconstruction } from '@/game/incidents/engine'
import { buildAnnualReview } from '@/game/debrief/review'
import { overallAssessment } from '@/game/debrief/assessment'
import { effortAllocation } from '@/game/debrief/prioritisation'
import { huntBlockedReason } from '@/game/threats/hunt'
import { pushMessage } from '@/game/inbox/messages'
import type { AnnualReviewDimension } from '@/game/types'

// The 5033820 playtest (pass 12): docs/playtests/2026-11-26-owner-supplied-5033820-matrix.md.
const index = testIndex()

describe('5033820 playtest fixes', () => {
  it('accelerates a programme once (MJ-27)', () => {
    const state = newGame(index, { seed: 'accelerate-once' })
    const def = index.programme.get('prog-identity')!
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok).toBe(true)
    state.resources.focusRemaining = 10
    state.resources.budgetRemaining = 5000
    const cost = Math.ceil(def.budgetCost)
    expect(applyAction(state, index, { type: 'accelerateProgramme', programmeId: def.id, budget: cost }).ok).toBe(true)
    const left = state.resources.budgetRemaining
    expect(applyAction(state, index, { type: 'accelerateProgramme', programmeId: def.id, budget: cost }).ok).toBe(false)
    expect(state.resources.budgetRemaining).toBe(left)
  })

  it('credits a risk raised from the register as gone near (MJ-06)', () => {
    const state = newGame(index, { seed: 'raised-from-register' })
    const missed = effortAllocation(state, index).missed!
    expect(applyAction(state, index, { type: 'openRisk', scenarioId: missed.id }).ok).toBe(true)
    expect(effortAllocation(state, index).missed?.id).not.toBe(missed.id)
  })

  it('does not blame a missing hunt nobody could commission (MJ-25)', () => {
    const state = newGame(index, { seed: 'unhuntable' })
    state.resources.budgetRemaining = 0
    expect(huntBlockedReason(state, index)).toContain('more than the £0k left')
    const path = index.content.attackPaths[0]!
    state.threats.campaigns.push({ id: 'camp-u', actorId: index.content.actors[0]!.id, pathId: path.id, stage: 'impact', stepIndex: 0, stepProgress: 0, startedDay: 10, lastAdvanceDay: 80, detected: false, disrupted: false } as never)
    state.flags['signal.camp-u.foothold'] = true
    state.flags['unhuntable.camp-u.foothold'] = true
    state.currentDay = 30
    pushMessage(state, { from: 'Sentinel SOC', subject: 'Low-confidence anomaly', body: 'x', type: 'threat', priority: 'routine', relatedNodeIds: [], signalCampaignId: 'camp-u' } as never)
    state.currentDay = 90
    const incident = createIncident(state, index, { familyId: index.content.incidentFamilies[0]!.id, pathId: path.id, campaign: state.threats.campaigns.at(-1) })!
    const text = buildReconstruction(state, index, incident).hurt.join(' ')
    expect(text).toContain('no targeted hunt could be commissioned at any warning')
  })

  it('reads data that left as damage, not as coming through (MJ-28)', () => {
    const state = newGame(index, { seed: 'data-left' })
    const incident = createIncident(state, index, { familyId: index.content.incidentFamilies[0]!.id })!
    incident.phase = 'closed'; incident.consequence = 0.05; incident.dataImpact = 0.7
    state.programmes.programmes['prog-identity'] = { ...state.programmes.programmes['prog-identity']!, status: 'complete', completedDay: 200 }
    state.currentDay = 363
    expect(buildAnnualReview(state, index).dimensions.find((d) => d.id === 'resilience')!.band).not.toBe('strong')
  })

  it('rates a two-of-five year no better than Mixed (MJ-24)', () => {
    const ids = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots']
    const strong = ids.map((id) => ({ id, label: id, band: 'strong', narrative: '', evidence: [] })) as unknown as AnnualReviewDimension[]
    expect(overallAssessment(strong, true, { met: 2, total: 5 }).label).toBe('Mixed')
    expect(overallAssessment(strong, true, { met: 3, total: 5 }).label).toBe('Exceptional')
  })

  it('names a large unspent budget at the close (MN-47)', () => {
    const state = newGame(index, { seed: 'unspent' })
    state.currentDay = 363
    state.resources.budgetRemaining = state.resources.budgetTotal * 0.8
    expect(buildAnnualReview(state, index).narrative.join(' ')).toContain('allocation unspent')
  })
})
