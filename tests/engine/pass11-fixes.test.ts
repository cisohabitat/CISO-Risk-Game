import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { createIncident } from '@/game/incidents/create'
import { buildReconstruction } from '@/game/incidents/engine'
import { unreportedScenarios } from '@/game/risk/unreported'
import { pushMessage } from '@/game/inbox/messages'

// The 73ad569 playtest (pass 11): docs/playtests/2026-11-25-owner-supplied-73ad569-matrix.md.
const index = testIndex()

describe('73ad569 playtest fixes', () => {
  it('counts a briefing to the board chair as the board having heard of a risk (MN-32)', () => {
    const state = newGame(index, { seed: 'chair-heard' })
    const id = index.content.riskScenarios[0]!.id
    applyEffects(state, [{ type: 'risk.open', scenarioId: id }], { index, rng: createRng(state.seed, 0), source: 'test' })
    state.risks.scenarios[id]!.status = 'accepted'
    expect(unreportedScenarios(state).map((s) => s.id)).toContain(id)
    expect(applyAction(state, index, { type: 'escalateRisk', scenarioId: id, stakeholderId: 'stk-board' }).ok).toBe(true)
    expect(state.risks.scenarios[id]!.escalatedToBoard).toBe(true)
    expect(unreportedScenarios(state).map((s) => s.id)).not.toContain(id)
  })

  it('credits a hunt that ran while the intrusion was under way, whenever it was commissioned (MJ-04)', () => {
    const state = newGame(index, { seed: 'hunt-credit' })
    const path = index.content.attackPaths[0]!
    state.threats.campaigns.push({ id: 'camp-h', actorId: index.content.actors[0]!.id, pathId: path.id, stage: 'impact', stepIndex: 0, stepProgress: 0, startedDay: 20, lastAdvanceDay: 80, detected: false, disrupted: false } as never)
    state.flags['signal.camp-h.1'] = true
    state.currentDay = 40
    pushMessage(state, { from: 'Sentinel SOC', subject: 'Low-confidence anomaly', body: 'x', type: 'threat', priority: 'notable', relatedNodeIds: [], signalCampaignId: 'camp-h' } as never)
    // A hunt commissioned before the first warning, still running after it.
    state.team.assignments.push({ id: 'a-h', kind: 'investigation', refId: 'inv-threat-hunt', title: 'Targeted threat hunt', leaderId: 'lead-soc', startedDay: 30, dueDay: 55, progress: 1, capacityPerDay: {}, status: 'complete', quality: 0.5, delivered: true, producedEvidenceIds: [] })
    state.currentDay = 90
    const incident = createIncident(state, index, { familyId: index.content.incidentFamilies[0]!.id, pathId: path.id, campaign: state.threats.campaigns.at(-1) })!
    const text = [...buildReconstruction(state, index, incident).hurt].join(' ')
    expect(text).not.toContain('no targeted hunt')
    expect(text).toContain('a targeted hunt returned while it was under way')
  })
})
