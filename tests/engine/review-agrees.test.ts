import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview } from '@/game/debrief/review'
import { effortAllocation } from '@/game/debrief/prioritisation'
import { unexaminedAssumptions } from '@/game/assumptions/validation'
import { unexaminedMaterial } from '@/game/knowledge/discovery'
import { testIndex } from './helpers'
import type { Difficulty, GameState } from '@/game/types'

/**
 * Three full years read end to end while grading, one per mode, and the close
 * contradicted its own record in each. These hold the review to agreeing with
 * itself and with what the player did, across seeds and modes, rather than
 * against one sentence each.
 */
const index = testIndex()

function playYear(seed: string, difficulty: Difficulty, build: boolean): GameState {
  const state = newGame(index, { seed, difficulty })
  const programmes = ['prog-identity', 'prog-ransomware']
  const enquiries = ['inv-service-review', 'inv-access-review', 'inv-architecture-review', 'inv-recovery-test']
  let nextProgramme = 0
  let nextEnquiry = 0
  for (let day = 0; day < 364; day += 1) {
    for (const id of [...state.decisions.openIds]) {
      const def = index.decision.get(state.decisions.decisions[id]!.defId)!
      for (const option of def.options) {
        const tags = def.rationaleTagIds?.slice(0, 1) ?? ['rat-more-evidence']
        if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: tags }).ok) break
      }
    }
    if (state.reviews.pendingQuarter !== undefined) {
      applyAction(state, index, {
        type: 'completeQuarterReview', quarter: state.reviews.pendingQuarter, topics: [], recommendations: [], communicateUncertainty: true,
      })
    }
    if (build) {
      if (nextProgramme < programmes.length && day % 40 === 5) {
        const def = index.programme.get(programmes[nextProgramme]!)!
        if (applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok) nextProgramme += 1
      }
      if (nextEnquiry < enquiries.length && state.team.assignments.every((a) => a.status !== 'running')) {
        const leader = index.content.leaders[nextEnquiry % index.content.leaders.length]!.id
        if (applyAction(state, index, { type: 'startInvestigation', investigationId: enquiries[nextEnquiry]!, leaderId: leader }).ok) nextEnquiry += 1
      }
      for (const programme of Object.values(state.programmes.programmes)) {
        for (const blocker of programme.blockers) {
          if (!blocker.resolved) applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: blocker.id })
        }
      }
    }
    runDays(state, index, 1)
  }
  return state
}

const years: { label: string; state: GameState }[] = []
for (const difficulty of ['guided', 'ciso', 'high-pressure'] as Difficulty[]) {
  for (const build of [true, false]) {
    for (const seed of ['agree-1', 'agree-2']) {
      years.push({ label: `${difficulty} ${build ? 'building' : 'idle'} ${seed}`, state: playYear(seed, difficulty, build) })
    }
  }
}

describe('the annual review agrees with itself', () => {
  it('leads the resilience sentence from the resilience band', () => {
    const sentences: Record<string, string> = {
      strong: 'came through with little lasting damage',
      solid: 'absorbed it, though not without cost',
      developing: 'took real damage before it recovered',
      weak: 'ran well beyond what the business could absorb',
    }
    let tested = 0
    for (const { label, state } of years) {
      if (Object.keys(state.incidents.incidents).length === 0) continue
      tested += 1
      const resilience = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'resilience')!
      expect(resilience.narrative, `${label}: ${resilience.band} beside "${resilience.narrative}"`).toContain(sentences[resilience.band])
    }
    expect(tested, 'no year had an incident to test this against').toBeGreaterThan(2)
  })

  it('names no dependency twice among the blind spots', () => {
    for (const { label, state } of years) {
      const pairs = buildAnnualReview(state, index)
        .blindSpots.map((line) => line.match(/the dependency between (.+) and (.+?) (stayed hidden|was never traced)/))
        .filter((m): m is RegExpMatchArray => Boolean(m))
        .map((m) => `${m[1]}|${m[2]}`)
      expect(new Set(pairs).size, `${label}: ${pairs.join(', ')}`).toBe(pairs.length)
    }
  })

  it('says a risk was "among" what the player committed to only when it was', () => {
    for (const { label, state } of years) {
      const review = buildAnnualReview(state, index)
      const prioritisation = review.dimensions.find((d) => d.id === 'prioritisation')!
      const named = prioritisation.narrative.match(/what mattered, (.+) among it/)?.[1]
      if (!named) continue
      const committed = effortAllocation(state, index).commitments.map((c) => c.scenarioTitle)
      expect(committed, `${label}: "${named}" named but not committed to`).toContain(named)
    }
  })

  it('blames chosen friction only on a year that chose some, and counts a single miss in the singular', () => {
    for (const { label, state } of years) {
      const review = buildAnnualReview(state, index)
      const enablement = review.dimensions.find((d) => d.id === 'business-enablement')!
      const built = Object.values(state.programmes.programmes).some((p) => p.status !== 'proposed')
      if (!built) expect(enablement.narrative, label).not.toMatch(/you chose to (run|impose)/)
      expect(review.businessOutcome, label).not.toMatch(/\b1 were\b/)
    }
  })

  it('does not call an assumption untested once the player met its test', () => {
    for (const { label, state } of years) {
      for (const assumption of unexaminedAssumptions(state, index)) {
        const control = state.controls.controls['ctl-backup']
        if (assumption.defId === 'asm-backup-tolerance' && control?.believed) {
          expect(control.believed.assessedOnDay, `${label}: tested backups after relying on them, still called untested`).toBeLessThan(
            assumption.createdDay,
          )
        }
      }
    }
  })
})

describe('the annual review, in the situations a played year rarely reaches', () => {
  it('names the risk the player aimed at, not the biggest one anything could have reached', () => {
    const state = newGame(index, { seed: 'among-it' })
    // The card data risk is the biggest thing in the world; the player funds
    // recovery, aimed at a risk almost as big.
    state.risks.initialMateriality = Object.fromEntries(
      index.content.riskScenarios.map((def) => [
        def.id,
        def.id === 'risk-payment-scope' ? 0.9 : def.id === 'risk-recovery-failure' ? 0.89 : 0.01,
      ]),
    )
    // The score needs the player to have answered what was put to them.
    runDays(state, index, 1)
    for (const id of [...state.decisions.openIds]) {
      const decision = index.decision.get(state.decisions.decisions[id]!.defId)!
      applyAction(state, index, {
        type: 'resolveDecision', decisionId: id, optionId: decision.options[0]!.id,
        rationaleTagIds: decision.rationaleTagIds?.slice(0, 1) ?? ['rat-more-evidence'],
      })
    }
    const def = index.programme.get('prog-ransomware')!
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok).toBe(true)
    const prioritisation = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'prioritisation')!
    expect(prioritisation.band, 'the arrangement did not reach the strong band this sentence belongs to').toBe('strong')
    expect(prioritisation.narrative).toContain('Recovery fails when it is needed among it')
    expect(prioritisation.narrative).not.toContain('Cardholder data')
  })

  it('does not blame chosen friction on a year that ran no programme', () => {
    const state = newGame(index, { seed: 'friction' })
    const objective = Object.values(state.business.objectives)[0]!
    objective.status = 'failed'
    const idle = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'business-enablement')!
    expect(idle.narrative).toContain('None of it was friction you imposed')
    expect(idle.narrative).not.toMatch(/you chose to (run|impose)/)

    const def = index.programme.get('prog-identity')!
    applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
    const built = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'business-enablement')!
    expect(built.narrative).toContain('Security programmes you chose to run were part of the pressure on it')
  })

  it('does not count an objective still in delivery as met', () => {
    // A year written up early, or a delay that carried a target past the last
    // day, leaves objectives neither achieved nor failed. "Met all five" was
    // written beside a list reading one achieved and four in delivery.
    const state = newGame(index, { seed: 'early-close' })
    const [first, ...rest] = Object.values(state.business.objectives)
    first!.status = 'achieved'
    for (const objective of rest) objective.status = 'active'
    const review = buildAnnualReview(state, index)
    expect(review.businessOutcome).toBe(`Nexora met 1 of 5 objectives; 4 were still in delivery.`)
    const enablement = review.dimensions.find((d) => d.id === 'business-enablement')!
    expect(enablement.narrative).toContain('4 were still in delivery')
    expect(enablement.narrative).not.toContain('met its commitments')

    for (const objective of rest) objective.status = 'achieved'
    expect(buildAnnualReview(state, index).businessOutcome).toBe('Nexora met all 5 of its stated objectives.')
  })
})

describe('what the close says about a system an incident ran through', () => {
  it('does not call it taken on trust beside a reconstruction that names it', () => {
    const state = newGame(index, { seed: 'incident-path' })
    const lake = state.organisation.nodes['node-data-analytics']!
    lake.discovered = true
    lake.verified = false
    const name = index.node.get('node-data-analytics')!.name
    const before = unexaminedMaterial(state, index).names.filter((s) => s.startsWith(name))
    expect(before).toEqual([`${name} was taken on trust and never examined`])

    state.incidents.incidents['inc-arranged'] = {
      ...({} as GameState['incidents']['incidents'][string]),
      id: 'inc-arranged', familyId: 'arranged', startedDay: 200, phase: 'closed', phaseEnteredDay: 220, resolvedDay: 220,
      reconstruction: {
        pathSummary: [{ stepId: 's1', nodeName: name, narrative: '', controlNames: [], wasBlocked: false }],
      } as unknown as NonNullable<GameState['incidents']['incidents'][string]['reconstruction']>,
    }
    const after = unexaminedMaterial(state, index).names.filter((s) => s.startsWith(name))
    expect(after).toEqual([`${name} was never examined, except by the incident that ran through it`])
  })
})
