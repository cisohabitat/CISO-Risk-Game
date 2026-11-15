import { expect, it } from 'vitest'
import { buildAnnualReview, chooseHeadline } from '@/game/debrief/review'
import { newGame } from '@/game/engine/orchestrator'
import type { AnnualReviewDimension } from '@/game/types'
import { testIndex } from './helpers'

// 42e2b80 playtest, November: "A year spent acting on a picture you never
// verified" named a quiet year that built both programmes, a month of
// ransomware, five incidents and a year that closed mid-ransomware alike.
const ids = ['risk-understanding', 'prioritisation', 'resilience', 'programme-execution', 'business-enablement', 'communication', 'team-sustainability', 'blind-spots']
const profile = (bands: Record<string, AnnualReviewDimension['band']>): AnnualReviewDimension[] =>
  ids.map((id) => ({ id, label: id, band: bands[id] ?? 'developing', narrative: 'x', evidence: [] }))

it('tells the year before what it missed', () => {
  const blind = { 'blind-spots': 'weak' } as const
  expect(chooseHeadline(profile({ ...blind, 'programme-execution': 'strong', 'business-enablement': 'strong' }), false)).toBe('A quiet year that bought the organisation real capability.')
  expect(chooseHeadline(profile({ ...blind, resilience: 'developing' }), true)).toBe('Tested, and it did not hold.')
  expect(chooseHeadline(profile({ ...blind, resilience: 'strong' }), true, true)).toBe('The year closed with an incident still running.')
  expect(chooseHeadline(profile({ ...blind, 'programme-execution': 'developing', 'business-enablement': 'developing' }), false)).toBe('A quiet year, on a picture nobody checked.')
})

it('prints each recorded cost once, however often its decision came up', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'recorded-cost-once' })
  const def = index.decision.get('dec-cardholder-scope')!
  const note = def.options.find((option) => option.id === 'opt-card-fix')!.delayedEffects![0]!.note!
  for (const [id, day] of [['first', 10], ['second', 20]] as const) {
    state.decisions.decisions[id] = { id, defId: def.id, createdDay: day, selectedOptionId: 'opt-card-fix', resolvedDay: day, resolvedByDefault: false, rationaleTagIds: [], assumptionIds: [] }
    state.history.decisionsLog.push({ decisionId: id, optionId: 'opt-card-fix', day } as never)
  }
  state.inbox.messages.push({ id: 'msg-follow', day: 200, from: 'Nexora Group', subject: `Followed up: ${def.title}`, body: note, type: 'decision', priority: 'notable', read: false } as never)
  const lines = buildAnnualReview(state, index).narrative.filter((line) => line.startsWith('Recorded cost'))
  expect(lines).toHaveLength(1)
})
