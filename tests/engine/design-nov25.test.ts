import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { createIncident } from '@/game/incidents/create'
import { overallAssessment } from '@/game/debrief/assessment'
import { buildAnnualReview } from '@/game/debrief/review'
import { openSocWarnings } from '@/store/selectors'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import type { AnnualReviewDimension } from '@/game/types'

// The owner's design list of 25 November, issues A to I (H is writing work).
const index = testIndex()

describe('design issues, 25 November', () => {
  it('A and B: a SOC warning stops the clock and stays on the Briefing until a hunt answers it', () => {
    let found = false
    for (let i = 0; i < 20 && !found; i += 1) {
      const state = newGame(index, { seed: `soc-stop-${i}` })
      for (let day = 0; day < 300 && !found; day += 1) {
        runDays(state, index, 1)
        if (!state.pauseReasons.includes('soc-warning')) continue
        found = true
        expect(state.inbox.messages.some((m) => m.signalCampaignId !== undefined && m.day >= state.currentDay - 1)).toBe(true)
        expect(openSocWarnings(state, index).length).toBeGreaterThan(0)
        state.team.assignments.push({ id: 'hunt', kind: 'investigation', refId: 'inv-threat-hunt', title: 'Targeted threat hunt', leaderId: 'lead-soc', startedDay: state.currentDay, dueDay: state.currentDay + 20, progress: 0, capacityPerDay: {}, status: 'running', quality: 0, delivered: false, producedEvidenceIds: [] })
        expect(openSocWarnings(state, index)).toEqual([])
      }
    }
    expect(found, 'no SOC warning in 20 years').toBe(true)
  })

  it('B: an incident closing stops the clock', () => {
    const state = newGame(index, { seed: 'closing-stop' })
    const incident = createIncident(state, index, { familyId: index.content.incidentFamilies[0]!.id })!
    let stopped = false
    for (let day = 0; day < 120 && !stopped; day += 1) {
      runDays(state, index, 1)
      if (incident.phase === 'closed') stopped = state.pauseReasons.includes('incident-closed')
    }
    expect(stopped).toBe(true)
  })

  it('C: one of five objectives or fewer caps the verdict at Difficult', () => {
    const ids = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots']
    const strong = ids.map((id) => ({ id, label: id, band: 'strong', narrative: '', evidence: [] })) as unknown as AnnualReviewDimension[]
    expect(overallAssessment(strong, true, { met: 1, total: 5 }).label).toBe('Difficult')
    expect(overallAssessment(strong, true, { met: 2, total: 5 }).label).toBe('Exceptional')
  })

  it('D: resilience above developing needs something built or tested', () => {
    const state = newGame(index, { seed: 'passive-resilience' })
    const incident = createIncident(state, index, { familyId: index.content.incidentFamilies[0]!.id })!
    incident.phase = 'closed'; incident.consequence = 0.05
    state.currentDay = 363
    const resilience = () => buildAnnualReview(state, index).dimensions.find((d) => d.id === 'resilience')!
    expect(resilience().band).toBe('developing')
    expect(resilience().narrative).toContain('nothing was built or tested')
    state.programmes.programmes['prog-identity'] = { ...state.programmes.programmes['prog-identity']!, status: 'complete', completedDay: 200 }
    expect(resilience().band).toBe('strong')
  })

  it('E: the post-incident £400k is once a year', () => {
    const def = index.decision.get('dec-post-incident')!
    const option = def.options.find((o) => o.id === 'opt-post-leverage')!
    expect(option.requirements?.condition).toBeDefined()
    expect(option.immediateEffects).toContainEqual({ type: 'flag.set', flag: 'post-funding.taken' })
    expect(option.immediateEffects.find((e) => e.type === 'board.confidence')).toMatchObject({ delta: -0.03 })
  })

  it('F: CISO and High pressure years have an incident by mid-year; Guided does not promise one', () => {
    expect(DIFFICULTY_PROFILES.guided.incidentFloorDay).toBeUndefined()
    for (const difficulty of ['ciso', 'high-pressure'] as const) {
      const floor = DIFFICULTY_PROFILES[difficulty].incidentFloorDay!
      for (let i = 0; i < 8; i += 1) {
        const state = newGame(index, { seed: `floor-${difficulty}-${i}`, difficulty })
        runDays(state, index, floor + 1)
        expect(Object.keys(state.incidents.incidents).length, `${difficulty} floor-${i}`).toBeGreaterThan(0)
      }
    }
  })

  it('G: a priced blocker can be worked around for nothing, and the last stage is not delivered', () => {
    const state = newGame(index, { seed: 'descope' })
    const def = index.programme.get('prog-identity')!
    const blocker = def.blockers.find((b) => (b.resolution.budget ?? 0) > 0)!
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok).toBe(true)
    state.programmes.programmes[def.id]!.blockers.push({ id: blocker.id, resolved: false } as never)
    const before = state.resources.budgetRemaining
    expect(applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: def.id, blockerId: blocker.id, descope: true }).ok).toBe(true)
    expect(state.resources.budgetRemaining).toBe(before)
    const runtime = state.programmes.programmes[def.id]!
    expect(runtime.descoped).toBe(true)
    runtime.progress = 0.999
    runDays(state, index, 30)
    const last = def.milestones.reduce((top, m) => (m.atProgress > top.atProgress ? m : top))
    expect(runtime.completedMilestoneIds).not.toContain(last.id)
  })

  it('I: each objective delay records its cause', () => {
    const state = newGame(index, { seed: 'delay-cause' })
    applyEffects(state, [{ type: 'objective.delay', objectiveId: 'obj-platform-launch', days: 45, cause: 'the security check by the go-live review' }], { index, rng: createRng(state.seed, 0), source: 'tick' })
    applyEffects(state, [{ type: 'objective.delay', objectiveId: 'obj-platform-launch', days: 1, cause: 'disruption' }, { type: 'objective.delay', objectiveId: 'obj-platform-launch', days: 1, cause: 'disruption' }], { index, rng: createRng(state.seed, 0), source: 'tick' })
    expect(state.business.objectives['obj-platform-launch']!.delayLog).toEqual([
      { day: state.currentDay, days: 45, cause: 'the security check by the go-live review' },
      { day: state.currentDay, days: 2, cause: 'disruption' },
    ])
  })
})
