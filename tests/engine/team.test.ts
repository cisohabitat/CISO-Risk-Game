import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { capacityBand, delegationOutlook, delegationQuality, teamStrain, updateTeamWellbeing } from '@/game/team/capacity'
import { CYBER_FUNCTIONS } from '@/game/types'
import { relationshipBand, supportLikelihood } from '@/game/stakeholders/relationships'
import { computeStaffing, deliveryConfidence } from '@/game/programmes/progression'
import { testIndex } from './helpers'
import { applyEffects } from '@/game/engine/effects'
import { deriveRng } from '@/game/engine/rng'

describe('team and delegation', () => {
  it('bands capacity without showing a number', () => {
    expect(capacityBand(0.2)).toBe('available')
    expect(capacityBand(0.75)).toBe('stretched')
    expect(capacityBand(0.99)).toBe('breaking')
  })

  it('returns lower-quality work from an overloaded leader', () => {
    const rested = delegationQuality({ id: 'a', skill: 0.8, reliability: 0.8, morale: 0.8, workload: 0.1, assignmentsCompleted: 0, assignmentsLate: 0 }, 0.2, 0.5)
    const buried = delegationQuality({ id: 'a', skill: 0.8, reliability: 0.8, morale: 0.4, workload: 0.95, assignmentsCompleted: 0, assignmentsLate: 0 }, 0.95, 0.5)
    expect(buried).toBeLessThan(rested)
  })

  it('does not promise room when the team behind an idle leader will send the work back thin', () => {
    // A playtest delegated to a leader the dialog said "has room", and the
    // review came back thin because the team was stretched: the label read the
    // leader's own workload, which is rarely high, and nothing else.
    const idle = { id: 'a', skill: 0.75, reliability: 0.7, morale: 0.5, workload: 0.1, assignmentsCompleted: 0, assignmentsLate: 0 }
    expect(delegationOutlook(idle, 0.2)).toBe('room')
    expect(delegationQuality(idle, 0.85, 0.5)).toBeLessThan(0.5)
    expect(delegationOutlook(idle, 0.85)).toBe('partial')
    expect(delegationOutlook({ ...idle, morale: 0.2, skill: 0.5 }, 0.9)).toBe('thin')
    expect(delegationOutlook({ ...idle, skill: 0.95, morale: 0.9, workload: 0.7 }, 0.2)).toBe('busy')
  })

  it('grinds morale down under sustained overcommitment', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'team-1' })
    for (const fn of Object.values(state.team.functions)) fn.committed = fn.capacity
    const before = state.team.functions['soc']!.morale
    for (let i = 0; i < 60; i += 1) updateTeamWellbeing(state)
    expect(state.team.functions['soc']!.morale).toBeLessThan(before)
    expect(teamStrain(state)).toBeGreaterThan(0.9)
  })

  it('slows a programme that the team cannot staff', () => {
    const index = testIndex()
    const staffed = newGame(index, { seed: 'team-2' })
    const starved = newGame(index, { seed: 'team-2' })
    const def = index.programme.get('prog-identity')!
    applyAction(staffed, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: def.budgetCost })
    applyAction(starved, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: def.budgetCost })
    // Starve it with real competing work rather than by poking the counter:
    // every other programme is running and holding the same people.
    for (const other of index.content.programmes) {
      if (other.id === 'prog-identity') continue
      starved.programmes.programmes[other.id]!.status = 'active'
    }
    expect(computeStaffing(starved, index, starved.programmes.programmes['prog-identity']!)).toBeLessThan(
      computeStaffing(staffed, index, staffed.programmes.programmes['prog-identity']!),
    )
    runDays(staffed, index, 60)
    runDays(starved, index, 60)
    expect(starved.programmes.programmes['prog-identity']!.progress).toBeLessThan(
      staffed.programmes.programmes['prog-identity']!.progress,
    )
  })

  it('reports delivery confidence qualitatively', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'team-3' })
    const def = index.programme.get('prog-detection')!
    applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-detection', budget: def.budgetCost })
    runDays(state, index, 40)
    const value = deliveryConfidence(state.programmes.programmes['prog-detection']!, index, state.currentDay)
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(1)
  })

  it('recruits over months rather than instantly', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'team-4' })
    const fn = Object.values(state.team.functions).find((f) => f.vacancies > 0)
    if (!fn) return
    const capacityBefore = fn.capacity
    const result = applyAction(state, index, { type: 'hire', fn: fn.fn })
    expect(result.ok).toBe(true)
    runDays(state, index, 30)
    expect(state.team.functions[fn.fn]!.capacity).toBe(capacityBefore)
    runDays(state, index, 35)
    expect(state.team.functions[fn.fn]!.capacity).toBeGreaterThan(capacityBefore)
  })
})

describe('stakeholders', () => {
  it('bands relationships without showing trust as a number', () => {
    expect(relationshipBand(0.1)).toBe('resistant')
    expect(relationshipBand(0.5)).toBe('neutral')
    expect(relationshipBand(0.9)).toBe('trusted')
  })

  it('makes a heavy ask less likely to succeed than a light one', () => {
    const person = { id: 'x', trust: 0.6, cyberUnderstanding: 0.5, riskTolerance: 0.5, concerns: [], memory: [] }
    expect(supportLikelihood(person, 0.8)).toBeLessThan(supportLikelihood(person, 0.1))
  })

  it('remembers significant decisions', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'stk-1' })
    applyAction(state, index, { type: 'meetStakeholder', stakeholderId: 'stk-coo', approach: 'listen' })
    const memory = state.stakeholders.stakeholders['stk-coo']!.memory
    expect(memory.length).toBeGreaterThan(0)
    expect(memory[0]!.day).toBe(state.currentDay)
  })
})

describe('capacity is consumed by the work that actually exists', () => {
  it('holds people for as long as a programme runs', () => {
    // The original bug: programmes declared a capacity demand but never
    // occupied anyone, so "delegated work competes with programme delivery"
    // was untrue and the team could never be overloaded.
    const index = testIndex()
    const state = newGame(index, { seed: 'commit-1' })
    const before = state.team.functions['iam']!.committed
    const def = index.programme.get('prog-identity')!

    applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: def.budgetCost })
    const committed = state.team.functions['iam']!.committed
    expect(committed).toBeGreaterThan(before)
    expect(committed).toBeCloseTo(def.capacityDemand.iam ?? 0, 5)

    // Pausing gives them back; resuming takes them again.
    applyAction(state, index, { type: 'setProgrammeStatus', programmeId: 'prog-identity', status: 'paused' })
    expect(state.team.functions['iam']!.committed).toBeCloseTo(before, 5)
    applyAction(state, index, { type: 'setProgrammeStatus', programmeId: 'prog-identity', status: 'active' })
    expect(state.team.functions['iam']!.committed).toBeCloseTo(committed, 5)
  })

  it('counts a second commission against the first on the same day', () => {
    // Derived capacity must be refreshed immediately, or same-day commissions
    // are each checked against a figure that predates the last.
    const index = testIndex()
    const state = newGame(index, { seed: 'commit-2' })
    let accepted = 0
    for (const investigation of index.content.investigations) {
      if (
        applyAction(state, index, {
          type: 'startInvestigation',
          investigationId: investigation.id,
          leaderId: 'lead-grc',
        }).ok
      ) {
        accepted += 1
      }
    }
    for (const fn of CYBER_FUNCTIONS) {
      const runtime = state.team.functions[fn]!
      expect(runtime.committed, `${fn} is committed beyond its capacity`).toBeLessThanOrEqual(runtime.capacity + 1e-6)
    }
    expect(accepted).toBeGreaterThan(0)
  })

  it('reads strain from the most pressed function, not the average', () => {
    // An IAM engineer cannot cover a SOC shift, so an average would hide the
    // situation the player most needs to see.
    const index = testIndex()
    const state = newGame(index, { seed: 'commit-3' })
    for (const fn of CYBER_FUNCTIONS) state.team.functions[fn]!.committed = 0
    const iam = state.team.functions['iam']!
    iam.committed = iam.capacity

    const strain = teamStrain(state)
    const flatAverage =
      CYBER_FUNCTIONS.reduce((sum, fn) => sum + state.team.functions[fn]!.committed, 0) /
      CYBER_FUNCTIONS.reduce((sum, fn) => sum + state.team.functions[fn]!.capacity, 0)
    expect(strain).toBeGreaterThan(flatAverage)
    expect(capacityBand(strain)).not.toBe('available')
  })

  it('lets an over-committing player reach overload, and a restrained one not', () => {
    const index = testIndex()
    const peak = (everything: boolean) => {
      const state = newGame(index, { seed: 'commit-4' })
      let worst = 0
      for (let day = 0; day < 240; day += 1) {
        if (everything) {
          for (const programme of index.content.programmes) {
            applyAction(state, index, { type: 'startProgramme', programmeId: programme.id, budget: programme.budgetCost })
          }
          for (const investigation of index.content.investigations) {
            applyAction(state, index, {
              type: 'startInvestigation',
              investigationId: investigation.id,
              leaderId: index.content.leaders[day % 4]!.id,
            })
          }
        }
        runDays(state, index, 1)
        worst = Math.max(worst, teamStrain(state))
      }
      return { worst, morale: Object.values(state.team.functions).reduce((s, f) => s + f.morale, 0) / 6 }
    }

    const restrained = peak(false)
    const overcommitted = peak(true)
    expect(capacityBand(restrained.worst)).toBe('available')
    expect(['overloaded', 'breaking']).toContain(capacityBand(overcommitted.worst))
    // Sustained overload must cost morale, not merely register on a gauge.
    expect(overcommitted.morale).toBeLessThan(restrained.morale)
  })
})

describe('the inherited vacancies', () => {
  const index = testIndex()
  it('are the five the briefing names, and recruiting fills one', () => {
    // "Five security vacancies", "both identity engineering roles" and a
    // recruitment decision that fills an identity role were drawn at random
    // across every function: five in a third of years, and no identity
    // vacancy in half, where the recruitment bought nothing.
    for (const difficulty of ['guided', 'ciso', 'high-pressure'] as const) {
      for (let i = 0; i < 20; i += 1) {
        const state = newGame(index, { seed: `vacancies-${difficulty}-${i}`, difficulty })
        const total = Object.values(state.team.functions).reduce((sum, fn) => sum + fn.vacancies, 0)
        expect(total, `${difficulty} ${i}`).toBe(5)
        expect(state.team.functions.iam!.vacancies, `${difficulty} ${i} identity`).toBe(2)
      }
    }
    const state = newGame(index, { seed: 'vacancies-recruit' })
    const before = state.team.functions.iam!.capacity
    const recruit = index.decision.get('dec-hire-or-outsource')!.options.find((o) => o.id === 'opt-hire-recruit')!
    applyEffects(state, recruit.delayedEffects!.flatMap((d) => d.effects), { index, rng: deriveRng('vacancies', 'test'), source: 'test' })
    expect(state.team.functions.iam!.capacity).toBeGreaterThan(before)
    expect(state.team.functions.iam!.vacancies).toBe(1)
  })
})

describe('a programme on its first day', () => {
  const index = testIndex()
  it('reads as staffed when its teams have room, before the first day of delivery', () => {
    // Staffing was worked out at the start of the next day's delivery, so a
    // programme started with every team idle read "Starved of people".
    const state = newGame(index, { seed: 'first-day-staffing' })
    const def = index.programme.get('prog-identity')!
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok).toBe(true)
    expect(state.programmes.programmes[def.id]!.staffing).toBeGreaterThan(0.85)
  })
})
