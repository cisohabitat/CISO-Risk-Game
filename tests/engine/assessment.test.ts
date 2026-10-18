import { describe, expect, it } from 'vitest'
import { overallAssessment } from '@/game/debrief/assessment'
import { buildAnnualReview } from '@/game/debrief/review'
import { programmeRelevance } from '@/game/debrief/prioritisation'
import { newGame } from '@/game/engine/orchestrator'
import type { AnnualReviewDimension } from '@/game/types'
import { testIndex } from './helpers'

const ids = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots']
function profile(overrides: Record<string, AnnualReviewDimension['band']> = {}): AnnualReviewDimension[] {
  return ids.map((id) => ({ id, label: id, band: overrides[id] ?? 'strong', narrative: '', evidence: [] }))
}

describe('overall assessment safeguards', () => {
  it('requires tested capability for exceptional, while allowing a quiet exercised year', () => {
    expect(overallAssessment(profile(), false).label).toBe('Credible')
    expect(overallAssessment(profile(), true).label).toBe('Exceptional')
  })
  it.each(['prioritisation', 'team-sustainability'])('does not average away weak %s', (id) => {
    const result = overallAssessment(profile({ [id]: 'weak' }), true)
    expect(result.label).toBe('Mixed')
    expect(result.reason).toContain(id)
  })
  it('blocks exceptional for any weak dimension and makes multiple serious weaknesses difficult', () => {
    expect(overallAssessment(profile({ communication: 'weak' }), true).label).toBe('Credible')
    expect(overallAssessment(profile({ communication: 'weak', resilience: 'weak', 'blind-spots': 'weak' }), true).label).toBe('Difficult')
  })
  it('preserves equal-weight boundaries and never upgrades a poor average', () => {
    const solid = profile(Object.fromEntries(ids.map((id) => [id, 'solid'])))
    expect(overallAssessment(solid, true)).toEqual({ label: 'Credible' })
    expect(overallAssessment(profile(Object.fromEntries(ids.map((id) => [id, 'developing']))), true).label).toBe('Mixed')
    expect(overallAssessment(profile(Object.fromEntries(ids.map((id) => [id, 'weak']))), true)).toEqual({ label: 'Difficult' })
  })
})

const index = testIndex()
describe('programme delivery and relevance', () => {
  function campaign() {
    const state = newGame(index, { seed: 'assessment-relevance' })
    // Make the authored programme choices clearly distinct, without relying on
    // one seed happening to put a programme near a threshold.
    state.risks.initialMateriality = Object.fromEntries(index.content.riskScenarios.map((risk) => [risk.id, 0.1]))
    const first = index.content.programmes[0]!
    const target = index.content.riskScenarios.find((risk) => risk.treatmentProgrammeIds.includes(first.id))!
    state.risks.initialMateriality[target.id] = 1
    return state
  }
  it('distinguishes relevant delivery from completing work on smaller risks', () => {
    const state = campaign()
    const ranked = index.content.programmes.map((programme) => ({ id: programme.id, relevance: programmeRelevance(state, index, [programme.id])! })).sort((a, b) => b.relevance - a.relevance)
    const high = ranked[0]!.id
    const low = ranked.at(-1)!.id
    expect(programmeRelevance(state, index, [high])).toBe(1)
    expect(programmeRelevance(state, index, [low])).toBe(0)
    const complete = (id: string) => {
      const runtime = state.programmes.programmes[id]!
      runtime.status = 'complete'; runtime.startedDay = 0; runtime.completedDay = 100; runtime.progress = 1
    }
    complete(low)
    const before = structuredClone(state)
    const limited = buildAnnualReview(state, index).dimensions.find((dimension) => dimension.id === 'programme-execution')!
    expect(limited.band).toBe('solid')
    expect(limited.narrative).toContain('less material risks')
    expect(state).toEqual(before)
    state.programmes.programmes[low]!.status = 'proposed'
    complete(high)
    expect(buildAnnualReview(state, index).dimensions.find((dimension) => dimension.id === 'programme-execution')!.band).toBe('strong')
  })
  it('does not penalise successful risk reduction, tied choices or missing older snapshots', () => {
    const state = campaign()
    const id = index.content.programmes[0]!.id
    const original = programmeRelevance(state, index, [id])
    for (const node of Object.values(state.organisation.nodes)) node.exposure = 0
    expect(programmeRelevance(state, index, [id])).toBe(original)
    state.risks.initialMateriality = Object.fromEntries(index.content.riskScenarios.map((risk) => [risk.id, 0.2]))
    expect(programmeRelevance(state, index, [id])).toBe(1)
    delete state.risks.initialMateriality
    expect(Number.isFinite(programmeRelevance(state, index, [id]))).toBe(true)
    expect(programmeRelevance(state, index, [])).toBeUndefined()
    Object.assign(state.programmes.programmes[id]!, { status: 'complete', startedDay: 0, completedDay: 100, progress: 1 })
    const review = buildAnnualReview(state, index)
    expect(review.dimensions.find((dimension) => dimension.id === 'programme-execution')!.evidence.join(' ')).toContain('opening risk snapshot is unavailable')
  })
  it('does not count programmes completed in an earlier year', () => {
    const state = campaign()
    const programme = Object.values(state.programmes.programmes)[0]!
    programme.status = 'complete'; programme.startedDay = -100; programme.completedDay = -1; programme.progress = 1
    const result = buildAnnualReview(state, index).dimensions.find((dimension) => dimension.id === 'programme-execution')!
    expect(result.band).toBe('weak')
    expect(result.evidence).toHaveLength(0)
  })
})
