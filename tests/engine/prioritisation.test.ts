import { describe, expect, it } from 'vitest'
import { newGame, runDays, applyAction } from '@/game/engine/orchestrator'
import { aimedAt, effortAllocation } from '@/game/debrief/prioritisation'
import { buildAnnualReview } from '@/game/debrief/review'
import { testIndex } from './helpers'
import type { ContentIndex, GameState } from '@/game/types'

/**
 * Prioritisation measures where the effort went, so these guard the two ways
 * that measure can quietly stop working: by being unreachable, and by being
 * so easy that every play style scores the same.
 */

/** Programmes ranked by the materiality of what they treat, for this seed. */
function programmesByWeight(state: GameState, index: ContentIndex): string[] {
  const materiality = state.risks.initialMateriality!
  return index.content.programmes
    .map((programme) => ({
      id: programme.id,
      weight: Math.max(
        0,
        ...index.content.riskScenarios
          .filter((scenario) => scenario.treatmentProgrammeIds.includes(programme.id))
          .map((scenario) => materiality[scenario.id] ?? 0),
      ),
    }))
    .sort((a, b) => b.weight - a.weight)
    .map((p) => p.id)
}

function playBuilding(seed: string, programmeIds: string[]): GameState {
  const index = testIndex()
  const state = newGame(index, { seed })
  let started = 0
  for (let day = 0; day < 364; day += 1) {
    runDays(state, index, 1)
    if (started < programmeIds.length && day > 5) {
      const def = index.programme.get(programmeIds[started]!)
      if (!def) throw new Error(`${programmeIds[started]} is not a real programme id`)
      if (applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok) {
        started += 1
      }
    }
  }
  return state
}

describe('the day-one snapshot', () => {
  it('records materiality for every authored scenario, not just the inherited ones', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'snap-1' })
    const snapshot = state.risks.initialMateriality!
    expect(Object.keys(snapshot)).toHaveLength(index.content.riskScenarios.length)
    // The register mentions only some of them; finding the rest is the job.
    expect(Object.keys(state.risks.scenarios).length).toBeLessThan(index.content.riskScenarios.length)
    for (const value of Object.values(snapshot)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('differs between worlds, so the biggest risk is not a fixed answer', () => {
    const index = testIndex()
    const orders = ['w-1', 'w-2', 'w-3', 'w-4', 'w-5'].map((seed) => {
      const snapshot = newGame(index, { seed }).risks.initialMateriality!
      return Object.entries(snapshot)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .join(',')
    })
    expect(new Set(orders).size, 'every seed ranked the risks identically').toBeGreaterThan(1)
  })

  it('is taken before the player acts, so treating a risk does not erase it', () => {
    const index = testIndex()
    const ranked = programmesByWeight(newGame(index, { seed: 'snap-2' }), index)
    const state = playBuilding('snap-2', ranked.slice(0, 2))
    const before = state.risks.initialMateriality!
    // Whatever the programmes did to residual, the yardstick is unchanged.
    const fresh = newGame(index, { seed: 'snap-2' }).risks.initialMateriality!
    expect(before).toEqual(fresh)
    expect(effortAllocation(state, index).allocation).toBeGreaterThan(0.5)
  })
})

describe('effort allocation', () => {
  it('still scores a save written before the snapshot existed', () => {
    const index = testIndex()
    const ranked = programmesByWeight(newGame(index, { seed: 'legacy-1' }), index)
    const state = playBuilding('legacy-1', ranked.slice(0, 2))
    const withSnapshot = effortAllocation(state, index).allocation

    delete state.risks.initialMateriality
    const without = effortAllocation(state, index)
    expect(without.commitments.length).toBeGreaterThan(0)
    // Approximate, but not zero: a year of good choices is not erased by a
    // missing yardstick.
    expect(without.allocation).toBeGreaterThan(0)
    expect(withSnapshot).toBeGreaterThan(0)
  })

  it('separates aiming at the biggest risks from aiming at the smallest', () => {
    const index = testIndex()
    const ranked = programmesByWeight(newGame(index, { seed: 'alloc-1' }), index)

    const biggest = effortAllocation(playBuilding('alloc-1', ranked.slice(0, 2)), index)
    const smallest = effortAllocation(playBuilding('alloc-1', [...ranked].reverse().slice(0, 2)), index)

    expect(biggest.allocation).toBeGreaterThan(smallest.allocation)
    expect(biggest.allocation).toBeGreaterThan(0.9)
  })

  it('scores nothing for a player who committed to nothing', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'alloc-2' })
    runDays(state, index, 364)
    const result = effortAllocation(state, index)
    expect(result.commitments).toHaveLength(0)
    expect(result.allocation).toBe(0)
  })

  it('does not treat breadth as prioritisation', () => {
    // Commissioning everything grazes every risk in the campaign. Matching
    // through whole attack paths made that a perfect score on three enquiries,
    // because the paths cross the estate; the measure reads what a piece of
    // work was aimed at, so an undirected year lands mid-range.
    const index = testIndex()
    const state = newGame(index, { seed: 'alloc-3' })
    const ids = index.content.investigations.map((i) => i.id)
    let k = 0
    for (let day = 0; day < 364; day += 1) {
      runDays(state, index, 1)
      if (k >= ids.length) continue
      for (const leader of index.content.leaders) {
        if (applyAction(state, index, { type: 'startInvestigation', investigationId: ids[k]!, leaderId: leader.id }).ok) {
          k += 1
          break
        }
      }
    }
    expect(k, 'the probe never commissioned anything').toBeGreaterThan(8)
    const result = effortAllocation(state, index)
    expect(result.commitments.length).toBeGreaterThan(4)
    expect(result.allocation).toBeLessThan(0.85)
    expect(buildAnnualReview(state, index).dimensions.find((d) => d.id === 'prioritisation')!.band).not.toBe('strong')
  })

  it('reads the range the player was actually choosing within', () => {
    // The raw ratio never approaches zero: even the least material thing you
    // could commit to is a real risk, so the worst choices this campaign
    // offered still scored 0.71 unshaped and read `strong` on 19 seeds of 20.
    // The floor is computed from the campaign's own options.
    const index = testIndex()
    const ranked = programmesByWeight(newGame(index, { seed: 'alloc-6' }), index)
    const worst = effortAllocation(playBuilding('alloc-6', [...ranked].reverse().slice(0, 2)), index)

    expect(worst.raw).toBeGreaterThan(0.5)
    expect(worst.floor).toBeGreaterThan(0)
    expect(worst.allocation).toBeLessThan(worst.raw)
    expect(worst.allocation).toBeLessThan(0.65)
  })

  it('does not read one enquiry as aimed at most of the register', () => {
    // Guards the linkage itself. Matching through attack paths makes a single
    // enquiry graze a mean of 6 of the 14 scenarios and up to all of them,
    // which is not a statement about what anyone aimed at.
    const index = testIndex()
    const total = index.content.riskScenarios.length
    let widest = 0
    for (const def of index.content.investigations) {
      const aimed = aimedAt(index, { nodeIds: new Set(def.revealsNodeIds) })
      widest = Math.max(widest, aimed.length)
      expect(aimed.length, `${def.id} counts as aimed at ${aimed.length} of ${total} risks`).toBeLessThanOrEqual(4)
    }
    // And the link is not simply inert: some enquiries do aim somewhere.
    expect(widest).toBeGreaterThan(0)
  })

  it('names the biggest thing nobody went near', () => {
    const index = testIndex()
    const ranked = programmesByWeight(newGame(index, { seed: 'alloc-4' }), index)
    const state = playBuilding('alloc-4', [...ranked].reverse().slice(0, 1))
    const result = effortAllocation(state, index)
    expect(result.missed).toBeTruthy()
    const dimension = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'prioritisation')!
    expect(dimension.evidence.join(' | ')).toContain(result.missed!.title)
  })

  it('ignores work that was not about a risk rather than charging for it', () => {
    // A team review is real effort and addresses no authored scenario. Counting
    // it as a badly aimed commitment would mark a player down for looking after
    // their own people, which team sustainability already scores.
    const index = testIndex()
    const state = newGame(index, { seed: 'alloc-5' })
    let ran = false
    for (let day = 0; day < 120 && !ran; day += 1) {
      runDays(state, index, 1)
      for (const leader of index.content.leaders) {
        if (applyAction(state, index, { type: 'startInvestigation', investigationId: 'inv-team-review', leaderId: leader.id }).ok) {
          ran = true
          break
        }
      }
    }
    expect(ran, 'the team review never started').toBe(true)
    runDays(state, index, 240)
    expect(state.team.assignments.some((a) => a.refId === 'inv-team-review')).toBe(true)
    expect(effortAllocation(state, index).commitments.some((c) => c.label.toLowerCase().includes('team'))).toBe(false)
  })
})
