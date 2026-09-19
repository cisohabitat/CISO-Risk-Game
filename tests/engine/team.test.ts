import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { capacityBand, delegationQuality, teamStrain, updateTeamWellbeing } from '@/game/team/capacity'
import { relationshipBand, supportLikelihood } from '@/game/stakeholders/relationships'
import { computeStaffing, deliveryConfidence } from '@/game/programmes/progression'
import { testIndex } from './helpers'

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
    for (const fn of Object.values(starved.team.functions)) fn.committed = fn.capacity
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
