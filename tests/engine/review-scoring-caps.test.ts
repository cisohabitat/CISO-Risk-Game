import { expect, it } from 'vitest'
import { buildAnnualReview } from '@/game/debrief/review'
import { newGame } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

// 15-run playtest, November: a cost-cutter's rested team read "strong" with
// posts held empty, and a year with no enquiry read "what you committed to
// was what mattered".
const index = testIndex()

it('caps a rested team with three or more empty posts at solid, and says why', () => {
  const state = newGame(index, { seed: 'vacancies-held' })
  for (const fn of Object.values(state.team.functions)) { fn.morale = 0.9; fn.committed = 0 }
  const fns = Object.values(state.team.functions)
  for (const fn of fns) fn.vacancies = 0
  fns[0]!.vacancies = 2; fns[1]!.vacancies = 1
  const team = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'team-sustainability')!
  expect(team.band).toBe('solid')
  expect(team.narrative).toContain('posts empty')
  for (const fn of fns) fn.vacancies = 0
  expect(buildAnnualReview(state, index).dimensions.find((item) => item.id === 'team-sustainability')!.band).toBe('strong')
})

it('does not call prioritisation strong when nothing was looked into', () => {
  const state = newGame(index, { seed: 'no-enquiry' })
  state.team.assignments = []
  const dimension = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'prioritisation')!
  expect(dimension.band).not.toBe('strong')
})

// 427b290 playtest (MJ-08, MN-18): four or more posts held empty in a rested
// year read "solid" in every cost-cutting run. It is developing now.
it('caps a rested team with four or more empty posts, in a year that spent little, at developing', () => {
  const state = newGame(index, { seed: 'vacancies-four' })
  state.resources.budgetRemaining = state.resources.budgetTotal * 0.9
  for (const fn of Object.values(state.team.functions)) { fn.morale = 0.9; fn.committed = 0; fn.vacancies = 0 }
  Object.values(state.team.functions)[0]!.vacancies = 5
  const team = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'team-sustainability')!
  expect(team.band).toBe('developing')
  expect(team.narrative).toContain('rested but short')
})
