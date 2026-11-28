import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { createIncident } from '@/game/incidents/create'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { buildAnnualReview, chooseHeadline } from '@/game/debrief/review'
import { buildQuarterReview, materialTopics } from '@/game/debrief/quarter'
import { openDecisions } from '@/store/selectors'
import type { AnnualReviewDimension } from '@/game/types'

// The 57c9605 playtest (pass 14): docs/playtests/2026-11-28-owner-supplied-57c9605-matrix.md.
const index = testIndex()
const ids = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots']
const profile = (bands: Record<string, string>) => ids.map((id) => ({ id, label: id, band: bands[id] ?? 'solid', narrative: '', evidence: [] })) as unknown as AnnualReviewDimension[]

describe('57c9605 playtest fixes', () => {
  it('records an assumption already contradicted by what the player found as such, with no surprise and no required item (MJ-32)', () => {
    const state = newGame(index, { seed: 'known-false' })
    const edge = state.organisation.edges['edge-legacy-to-core']!
    edge.exists = true; edge.discovered = true
    const decision = openDecision(state, index, 'dec-legacy-retirement')!
    const view = openDecisions(state, index).find((d) => d.id === decision.id)!
    expect(view.options.find((o) => o.id === 'opt-legacy-accept')!.assumesContradicted.join(' ')).toContain('routable')
    expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-legacy-accept', rationaleTagIds: ['rat-retirement'] }).ok).toBe(true)
    const isolated = Object.values(state.assumptions.assumptions).find((a) => a.defId === 'asm-legacy-isolated')!
    expect(isolated.status).toBe('invalidated')
    expect(isolated.invalidationReason).toContain('already found')
    expect(materialTopics(state, index).find((t) => t.id === `assumption:${isolated.id}`)?.material).toBe(false)
  })

  it('makes the free overload relief relieve, and does not cite it as what hurt (MJ-31)', () => {
    const option = index.decision.get('dec-team-overload')!.options.find((o) => o.id === 'opt-overload-defer')!
    expect(option.immediateEffects.find((e) => e.type === 'capacity.change')).toMatchObject({ delta: 1.25 })
    expect(option.immediateEffects.some((e) => e.type.startsWith('control.'))).toBe(false)
    expect(option.visibleKnownEffects.join(' ')).toContain('vulnerability exposure rises')
  })

  it('says each delay an option imposes on the decision card (MJ-16)', () => {
    const state = newGame(index, { seed: 'delay-said' })
    const decision = openDecision(state, index, 'dec-budget-reallocation')!
    const refuse = openDecisions(state, index).find((d) => d.id === decision.id)!.options.find((o) => o.id === 'opt-budget-refuse')!
    expect(refuse.visibleKnownEffects.some((text) => /waits 20 days/.test(text))).toBe(true)
  })

  it('does not head a Credible year "did not hold" (MJ-10)', () => {
    const shaky = profile({ resilience: 'developing' })
    expect(chooseHeadline(shaky, true, false, { incidents: 1, worst: 0.5, verdict: 'Credible' })).not.toBe('Tested, and it did not hold.')
    expect(chooseHeadline(shaky, true, false, { incidents: 1, worst: 0.5, verdict: 'Mixed' })).toBe('Tested, and it did not hold.')
  })

  it('does not call a decision quiet when a paper reported its incident (MJ-07)', () => {
    const state = newGame(index, { seed: 'reported-quiet' })
    state.currentDay = 363
    const incident = createIncident(state, index, { familyId: 'fam-payment-fraud' })!
    incident.phase = 'closed'
    state.decisions.decisions['recall'] = { id: 'recall', defId: 'dec-inc-recall', createdDay: 100, selectedOptionId: 'opt-recall-absorb', resolvedDay: 101, resolvedByDefault: false, rationaleTagIds: [], assumptionIds: [], incidentId: incident.id }
    const line = 'You absorbed the misdirected payment inside finance rather than report it.'
    expect(buildAnnualReview(state, index).dimensions.find((d) => d.id === 'communication')!.evidence).toContain(line)
    state.reviews.quarters.push({ quarter: 2, day: 182, topicsChosen: [`incident:${incident.id}`], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
    expect(buildAnnualReview(state, index).dimensions.find((d) => d.id === 'communication')!.evidence).not.toContain(line)
  })

  it('does not count a thin recovery test as an exercise (MN-54)', () => {
    const state = newGame(index, { seed: 'thin-test' })
    state.currentDay = 363
    state.team.assignments.push({ id: 't', kind: 'investigation', refId: 'inv-recovery-test', title: 'Recovery test', leaderId: 'lead-ir', startedDay: 40, dueDay: 60, progress: 1, capacityPerDay: {}, status: 'complete', quality: 0.2, delivered: true, producedEvidenceIds: [] } as never)
    expect(buildAnnualReview(state, index).dimensions.find((d) => d.id === 'resilience')!.evidence.join(' ')).toContain('came back thin')
  })

  it('varies the reply to a paper that recommends nothing again (MJ-09)', () => {
    const state = newGame(index, { seed: 'again-nothing' })
    const topic = ['risk:fixture']
    state.reviews.quarters.push({ quarter: 1, day: 91, topicsChosen: topic, recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
    state.currentDay = 182
    const second = buildQuarterReview(state, index, { quarter: 2, topics: topic, recommendations: [], communicateUncertainty: true })
    expect(second.boardReaction).toContain('Again the paper asks the committee for nothing')
  })

  it('says what a debt paydown came from (MN-01)', () => {
    const state = newGame(index, { seed: 'paydown-source' })
    state.resources.unfundedCommitment = 200
    applyEffects(state, [{ type: 'budget.change', amount: 90, note: 'A duplicate tool has been cancelled.' }], { index, rng: createRng(state.seed, 0), source: 'event:evt-org-tooling-overlap' })
    expect(state.history.entries.at(-1)!.summary).toContain('(A duplicate tool has been cancelled)')
  })
})

// "Fix all" on the 57c9605 report (owner, 28 November).
describe('57c9605 fix all', () => {
  it('offers a board briefing while an incident is in its response phase (MJ-33)', async () => {
    const { canBriefBoard } = await import('@/game/incidents/board')
    expect(canBriefBoard({ phase: 'response', boardInformedDay: undefined } as never)).toBe(true)
  })

  it('lets a worn function recover at three-fifths load (MJ-31)', async () => {
    const { nextFunctionMorale } = await import('@/game/team/capacity')
    const state = newGame(index, { seed: 'recover' })
    const fn = state.team.functions.engineering!
    fn.morale = 0.1; fn.vacancies = 0; fn.capacity = 4; fn.committed = 2.4
    expect(nextFunctionMorale(state, 'engineering')).toBeGreaterThan(0.1)
  })
})
