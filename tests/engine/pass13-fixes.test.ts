import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, describeStop, newGame } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { createIncident } from '@/game/incidents/create'
import { buildReconstruction } from '@/game/incidents/engine'
import { chooseHeadline } from '@/game/debrief/review'
import { huntBlockedReason, huntReportsAfterYearEnd } from '@/game/threats/hunt'
import { pushMessage } from '@/game/inbox/messages'
import { openDecisions, wantsYouCount } from '@/store/selectors'
import type { AnnualReviewDimension } from '@/game/types'

// The 427b290 playtest (pass 13): docs/playtests/2026-11-27-owner-supplied-427b290-matrix.md.
const index = testIndex()
const ids = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots']
const profile = (bands: Record<string, string>) => ids.map((id) => ({ id, label: id, band: bands[id] ?? 'solid', narrative: '', evidence: [] })) as unknown as AnnualReviewDimension[]

function weaken(state: ReturnType<typeof newGame>, controlId: string) {
  Object.assign(state.controls.controls[controlId]!, { coverage: 0.2, operationalEffectiveness: 0.2 })
}

describe('427b290 playtest fixes', () => {
  it('cites a decision only when the attack crossed its systems (MJ-29)', () => {
    const state = newGame(index, { seed: 'on-path' })
    const legacy = openDecision(state, index, 'dec-legacy-retirement')!
    expect(applyAction(state, index, { type: 'resolveDecision', decisionId: legacy.id, optionId: 'opt-legacy-accept', rationaleTagIds: ['rat-retirement'] }).ok).toBe(true)
    const kestrel = openDecision(state, index, 'dec-acquisition-integration')!
    expect(applyAction(state, index, { type: 'resolveDecision', decisionId: kestrel.id, optionId: 'opt-acq-connect', rationaleTagIds: ['rat-more-evidence'] }).ok).toBe(true)
    weaken(state, 'ctl-segmentation'); weaken(state, 'ctl-vuln')
    state.currentDay += 1
    const warehouse = 'The legacy warehouse platform'
    const msp = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
    expect(buildReconstruction(state, index, msp).hurt.join(' ')).not.toContain(warehouse)
    const legacyRoute = createIncident(state, index, { familyId: 'fam-legacy-outage', pathId: 'path-phish-legacy' })!
    expect(buildReconstruction(state, index, legacyRoute).hurt.join(' ')).toContain(warehouse)
    const acquisition = createIncident(state, index, { familyId: 'fam-data-theft', pathId: 'path-kestrel-espionage' })!
    expect(buildReconstruction(state, index, acquisition).hurt.join(' ')).toContain('"Connect on schedule"')
  })

  it('shows the assumption an option records, and names its decision when it fails (MJ-30)', () => {
    const state = newGame(index, { seed: 'assumes' })
    const decision = openDecision(state, index, 'dec-legacy-retirement')!
    const view = openDecisions(state, index).find((d) => d.id === decision.id)!
    expect(view.options.find((o) => o.id === 'opt-legacy-accept')!.assumes).toContain('The legacy estate remains isolated from the production environment.')
    expect(view.options.find((o) => o.id === 'opt-legacy-isolate')!.assumes).toEqual([])
    expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-legacy-accept', rationaleTagIds: ['rat-retirement'] }).ok).toBe(true)
    const assumption = Object.values(state.assumptions.assumptions).find((a) => a.linkedDecisionId === decision.id)!
    assumption.status = 'invalidated'; assumption.invalidatedDay = state.currentDay
    const text = describeStop(state, index, ['assumption-invalidated'])
    expect(text).toContain('behind your decision on "The legacy warehouse platform"')
    expect(text).not.toContain('you recorded')
  })

  it('does not promise a hunt result on "34 December" (MN-49)', () => {
    const state = newGame(index, { seed: 'late-hunt' })
    state.currentDay = 355
    state.resources.budgetRemaining = 500
    state.resources.focusRemaining = 10
    expect(huntReportsAfterYearEnd(state, index)).toBe(true)
    const leader = Object.keys(state.team.leaders ?? {})[0] ?? 'lead-soc'
    const result = applyAction(state, index, { type: 'startInvestigation', investigationId: 'inv-threat-hunt', leaderId: leader })
    expect(result.ok, result.message).toBe(true)
    expect(result.message).toContain('after 31 December')
    expect(result.message).not.toMatch(/3[2-9] December/)
    expect(huntBlockedReason(state, index)).toContain('already running')
  })

  it('reads how hard the year was hit before choosing a headline (MJ-10)', () => {
    const held = profile({ resilience: 'solid', 'risk-understanding': 'developing' })
    expect(chooseHeadline(held, true, false, { incidents: 1, worst: 0.6, encrypted: true })).toBe('It was hit hard, and it recovered.')
    expect(chooseHeadline(held, true, false, { incidents: 1, worst: 0.2 })).toBe('It held, on a picture you never verified.')
    const shaky = profile({ resilience: 'developing', 'business-enablement': 'strong', 'programme-execution': 'strong' })
    expect(chooseHeadline(shaky, true, false, { incidents: 1, worst: 0.5 })).toBe('Tested, and it did not hold.')
    expect(chooseHeadline(shaky, true, false, { incidents: 1, worst: 0.15 })).not.toBe('Tested, and it did not hold.')
  })

  it('counts a SOC warning as waiting on the player (CS-26)', () => {
    const state = newGame(index, { seed: 'waiting-warning' })
    const before = wantsYouCount(state, index)
    const path = index.content.attackPaths[0]!
    state.threats.campaigns.push({ id: 'camp-w', actorId: index.content.actors[0]!.id, pathId: path.id, stage: 'foothold', stepIndex: 0, stepProgress: 0, startedDay: 0, lastAdvanceDay: 0, detected: false, disrupted: false } as never)
    pushMessage(state, { from: 'Sentinel SOC', subject: 'Low-confidence anomaly', body: 'x', type: 'threat', priority: 'routine', relatedNodeIds: [], signalCampaignId: 'camp-w' } as never)
    expect(wantsYouCount(state, index)).toBe(before + 1)
  })

  it('a security check that holds a launch says "not cleared" in its letter (MN-48)', () => {
    const launch = index.content.objectives.find((o) => o.id === 'obj-platform-launch')!
    expect(launch.gate!.unmet.subject).toBe('Go-live review: platform not cleared')
  })
})
