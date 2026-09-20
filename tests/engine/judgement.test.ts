import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview, reasoningReview } from '@/game/debrief/review'
import { topConcerns, visibleRisks, openDecisions, patternSuggestions } from '@/store/selectors'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { testIndex } from './helpers'

/**
 * The review has to judge the year the player actually had.
 *
 * Each of these guards a place where the assessment credited or blamed
 * something it had not established: a quiet year graded as demonstrated
 * capability, an incident used against a decision taken after it, and a risk
 * that disappeared from the briefing because the player took responsibility
 * for it.
 */
describe('resilience is not awarded for a quiet year', () => {
  it('never reads strong when nothing tested the organisation', () => {
    const index = testIndex()
    let quiet = 0
    for (let seed = 0; seed < 14; seed += 1) {
      const state = newGame(index, { seed: `res-${seed}` })
      runDays(state, index, 364)
      if (Object.keys(state.incidents.incidents).length > 0) continue
      quiet += 1
      const dimension = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'resilience')!
      expect(dimension.band).not.toBe('strong')
      // And the sentence agrees with the band rather than asking a question the
      // band has already answered in the player's favour.
      expect(dimension.narrative).toMatch(/not a demonstrated capability|only evidence you have/)
    }
    expect(quiet, 'no quiet year in the sample — the assertion never ran').toBeGreaterThan(0)
  })

  it('says whether recovery was ever exercised', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'res-ev' })
    runDays(state, index, 364)
    const dimension = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'resilience')!
    expect(dimension.evidence.join(' | ')).toMatch(/[Rr]ecovery (was never exercised|exercises? completed)/)
    expect(dimension.evidence.join(' | ')).toMatch(/recovery controls carried assurance you established yourself/)
  })
})

describe('reasoning is judged in order', () => {
  it('does not let an earlier incident contradict a later acceptance', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'chron-1' })
    runDays(state, index, 40)

    const scenario = Object.values(state.risks.scenarios)[0]!
    const def = index.riskScenario.get(scenario.id)!
    const pathId = def.attackPathIds[0]
    expect(pathId, 'the fixture scenario has no attack path to test with').toBeTruthy()

    // An incident on this path, then an acceptance recorded well after it.
    state.incidents.incidents['inc-early'] = {
      ...Object.assign({}, state.incidents.incidents['inc-early']),
      id: 'inc-early',
      familyId: index.content.incidentFamilies[0]!.id,
      pathId,
      startedDay: 40,
      consequence: 0.3,
      containment: 1,
      recovery: 1,
      phase: 'closed',
      decisionsTaken: [],
    } as (typeof state.incidents.incidents)[string]

    state.history.entries.push({
      day: 120,
      kind: 'risk-accepted',
      summary: 'Accepted after remediation',
      refs: [scenario.id, 'rat-within-tolerance'],
    })

    const before = reasoningReview(state, index).find((l) => l.tagId === 'rat-within-tolerance')
    expect(before?.materialised ?? 0).toBe(0)

    // The same incident after the acceptance does count against it.
    state.incidents.incidents['inc-early']!.startedDay = 200
    const after = reasoningReview(state, index).find((l) => l.tagId === 'rat-within-tolerance')
    expect(after?.materialised).toBe(1)
  })
})

describe('the briefing shows what deserves attention', () => {
  it('keeps a risk the player accepted', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'top-1' })
    runDays(state, index, 30)

    const scenario = Object.values(state.risks.scenarios).find((s) => s.status !== 'closed')!
    scenario.status = 'accepted'

    const ids = topConcerns(state, index, 10).map((r) => r.id)
    expect(ids, 'accepting a risk removed it from the briefing').toContain(scenario.id)
  })

  it('drops a risk that is closed', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'top-2' })
    runDays(state, index, 30)
    const scenario = Object.values(state.risks.scenarios)[0]!
    scenario.status = 'closed'
    expect(topConcerns(state, index, 10).map((r) => r.id)).not.toContain(scenario.id)
  })

  it('marks a scenario nobody has assessed rather than calling it low', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'top-3' })

    // The route that creates one: a risk the player raises themselves has not
    // been assessed yet. Reachable in every campaign measured.
    let raised: string | undefined
    for (let day = 0; day < 364 && !raised; day += 1) {
      runDays(state, index, 1)
      const suggestion = patternSuggestions(state, index)[0]
      if (!suggestion) continue
      const made = applyAction(state, index, {
        type: 'createHypothesis',
        templateId: suggestion.templateId,
        evidenceIds: suggestion.evidence.map((e) => e.id),
      })
      if (!made.ok) continue
      const hypothesisId = Object.keys(state.risks.hypotheses).at(-1)!
      if (applyAction(state, index, { type: 'convertHypothesis', hypothesisId }).ok) {
        raised = state.risks.hypotheses[hypothesisId]!.linkedScenarioId
      }
    }

    expect(raised, 'no scenario was ever raised — the assertion never ran').toBeTruthy()
    const view = visibleRisks(state, index).find((r) => r.id === raised)!
    expect(view.assessed).toBe(false)
  })
})

describe('the harder modes do not name the answer', () => {
  it('shows a decision teaching note on guided and withholds it above', () => {
    const index = testIndex()
    const shown: Record<string, boolean> = {}
    for (const difficulty of ['guided', 'ciso', 'high-pressure'] as const) {
      const state = newGame(index, { seed: 'coach-1', difficulty })
      let sawNote = false
      for (let day = 0; day < 364 && !sawNote; day += 1) {
        runDays(state, index, 1)
        if (openDecisions(state, index).some((d) => d.teaches)) sawNote = true
      }
      shown[difficulty] = sawNote
    }
    expect(shown.guided, 'guided never showed a teaching note').toBe(true)
    expect(shown.ciso).toBe(false)
    expect(shown['high-pressure']).toBe(false)
  })

  it('keeps the dial in the difficulty profile', () => {
    expect(DIFFICULTY_PROFILES.guided.showsDecisionCoaching).toBe(true)
    expect(DIFFICULTY_PROFILES.ciso.showsDecisionCoaching).toBe(false)
    expect(DIFFICULTY_PROFILES['high-pressure'].showsDecisionCoaching).toBe(false)
  })
})
