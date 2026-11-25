import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { createIncident } from '@/game/incidents/create'
import { overallAssessment } from '@/game/debrief/assessment'
import { chooseHeadline } from '@/game/debrief/review'
import { renderDecisionText } from '@/game/decisions/describe'
import { incidentName } from '@/store/selectors'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import type { AnnualReviewDimension } from '@/game/types'

// The owner's second design list of 25 November, J to Q and H.
const index = testIndex()
const ids = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots']
const profile = (bands: Record<string, string>) => ids.map((id) => ({ id, label: id, band: bands[id] ?? 'solid', narrative: '', evidence: [] })) as unknown as AnnualReviewDimension[]

describe('design issues J to Q, 25 November', () => {
  it('J: a quiet, delivered Guided year is not rated below Mixed', () => {
    expect(DIFFICULTY_PROFILES.guided.quietYearFloor).toBe('Mixed')
    expect(DIFFICULTY_PROFILES.ciso.quietYearFloor).toBeUndefined()
    const weak = profile({ resilience: 'weak', 'programme-execution': 'weak', 'blind-spots': 'weak' })
    expect(overallAssessment(weak, false, { met: 4, total: 5 }).label).toBe('Difficult')
    expect(overallAssessment(weak, false, { met: 4, total: 5 }, 'Mixed').label).toBe('Mixed')
  })

  it('O: a delay pauses delivery and never takes progress back', () => {
    const state = newGame(index, { seed: 'pause' })
    const objective = state.business.objectives['obj-platform-launch']!
    objective.status = 'active'; objective.progress = 0.9
    applyEffects(state, [{ type: 'objective.delay', objectiveId: 'obj-platform-launch', days: 45, cause: 'test' }], { index, rng: createRng(state.seed, 0), source: 'tick' })
    expect(objective.progress).toBe(0.9)
    expect(objective.delayOwedDays).toBe(45)
  })

  it('K: December has decisions of its own', () => {
    const state = newGame(index, { seed: 'december' })
    state.flags['incident.floor'] = true
    runDays(state, index, 350)
    const opened = Object.values(state.decisions.decisions).map((d) => d.defId)
    expect(opened).toContain('dec-q4-change-freeze')
    expect(opened).toContain('dec-q4-holiday-cover')
  })

  it('N: the card-data question comes before the Nordic check, by August at the latest', () => {
    for (let i = 0; i < 6; i += 1) {
      const state = newGame(index, { seed: `card-${i}` })
      state.flags['incident.floor'] = true
      runDays(state, index, 230)
      expect(Object.values(state.decisions.decisions).some((d) => d.defId === 'dec-cardholder-scope'), `card-${i}`).toBe(true)
    }
  })

  it('P: the overload decision remembers it has been asked before', () => {
    const state = newGame(index, { seed: 'overload-again' })
    expect(renderDecisionText('X.{{overloadHistory}}', state, index)).toBe('X.')
    state.decisions.decisions['o1'] = { id: 'o1', defId: 'dec-team-overload', createdDay: 40, selectedOptionId: 'opt-overload-stop', resolvedDay: 41, resolvedByDefault: false, rationaleTagIds: [], assumptionIds: [] }
    expect(renderDecisionText('X.{{overloadHistory}}', state, index)).toBe('X. This is the second time this year they have said so. Last time the answer was "Stop something".')
  })

  it('Q: a second incident of a kind is numbered', () => {
    const state = newGame(index, { seed: 'numbered' })
    const family = index.content.incidentFamilies[0]!.id
    const first = createIncident(state, index, { familyId: family })!
    state.currentDay = 50
    const second = createIncident(state, index, { familyId: family })!
    expect(incidentName(state, index, first)).toBe(index.incidentFamily.get(family)!.name)
    expect(incidentName(state, index, second)).toBe(`${index.incidentFamily.get(family)!.name} (second this year)`)
  })

  it('H: an empty paper again is a pattern, and the headline does not contradict the objectives', () => {
    const state = newGame(index, { seed: 'empty-again' })
    const empty = { topics: [], recommendations: [], communicateUncertainty: false }
    for (const quarter of [1, 2, 3]) {
      state.currentDay = quarter * 91
      state.reviews.pendingQuarter = quarter
      state.resources.focusRemaining = 5
      expect(applyAction(state, index, { type: 'completeQuarterReview', quarter, ...empty }).ok).toBe(true)
    }
    const reactions = state.reviews.quarters.map((paper) => paper.boardReaction)
    expect(new Set(reactions).size).toBe(3)
    expect(reactions[1]).toContain('second quarter running')
    const businessYear = profile({ 'business-enablement': 'strong', 'programme-execution': 'weak' })
    expect(chooseHeadline(businessYear, false)).toBe('The business got its year. The security programme did not.')
    expect(chooseHeadline(businessYear, false, false, { missed: 2 })).not.toContain('The business got its year')
  })
})
