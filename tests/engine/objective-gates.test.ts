import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { newGame, runDays } from '@/game/engine/orchestrator'

// Security gates on business objectives (owner, 17 November): checked once on
// their day; met speeds delivery a little, unmet costs six weeks.
function at(day: number, seed = 'objective-gates') {
  const index = testIndex()
  const state = newGame(index, { seed })
  state.currentDay = day
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  state.decisions.openIds = []
  state.threats.actors = {}; state.threats.campaigns = []
  state.pendingEffects = []
  for (const objective of Object.values(state.business.objectives)) { objective.status = 'active'; objective.progress = 0.5 }
  return { state, index }
}

it('holds the Nordic market for six weeks when nobody can answer for card data', () => {
  const { state, index } = at(234)
  state.controls.controls['ctl-dlp']!.coverage = 0.2
  runDays(state, index, 2)
  const objective = state.business.objectives['obj-new-market']!
  expect(objective.gate).toBe('unmet')
  expect(objective.delayDays).toBe(45)
  expect(state.inbox.messages.some((message) => message.subject === 'Nordic acquiring bank: card data questions open')).toBe(true)
})

it('clears the Kestrel join once the acquisition was quarantined, and checks only once', () => {
  const { state, index } = at(229)
  state.decisions.decisions['dec-x'] = { id: 'dec-x', defId: 'dec-acquisition-integration', createdDay: 200, deadlineDay: 214, selectedOptionId: 'opt-acq-quarantine', resolvedDay: 205, resolvedByDefault: false, rationaleTagIds: [], assumptionIds: [] }
  const before = state.business.objectives['obj-acquisition']!.progress
  runDays(state, index, 30)
  const objective = state.business.objectives['obj-acquisition']!
  expect(objective.gate).toBe('met')
  expect(objective.securitySupported).toBe(true)
  expect(objective.delayDays).toBe(0)
  expect(objective.progress).toBeGreaterThan(before + 0.04)
  expect(state.inbox.messages.filter((message) => message.subject.startsWith('Kestrel: auditors')).length).toBe(1)
})

it('clears the platform launch on strong MFA without launch conditions', () => {
  const { state, index } = at(129)
  state.controls.controls['ctl-mfa']!.coverage = 0.9
  runDays(state, index, 2)
  expect(state.business.objectives['obj-platform-launch']!.gate).toBe('met')
})

it('does not check an objective already delivered', () => {
  const { state, index } = at(129)
  state.business.objectives['obj-platform-launch']!.status = 'achieved'
  runDays(state, index, 2)
  expect(state.business.objectives['obj-platform-launch']!.gate).toBeUndefined()
})

it('carries a security check into the second year, on the service desk assistant', async () => {
  const index = testIndex()
  const { beginNextYear } = await import('@/game/engine/next-year')
  const { finishYear } = await import('@/game/debrief/review')
  const first = newGame(index, { seed: 'objective-gates-y2' })
  first.events.suppressedEventIds = index.content.events.map((event) => event.id)
  runDays(first, index, 364)
  finishYear(first, index)
  const second = beginNextYear(index, first)
  expect(second.business.objectives['obj-y2-assistant']).toBeDefined()
  second.currentDay = 159
  second.events.suppressedEventIds = index.content.events.map((event) => event.id)
  second.decisions.openIds = []
  second.threats.actors = {}; second.threats.campaigns = []
  second.pendingEffects = []
  Object.assign(second.business.objectives['obj-y2-assistant']!, { status: 'active', progress: 0.5 })
  second.controls.controls['ctl-dlp']!.coverage = 0.2
  runDays(second, index, 2)
  expect(second.business.objectives['obj-y2-assistant']!.gate).toBe('unmet')
  expect(second.inbox.messages.some((message) => message.subject === 'Data protection review: assistant held')).toBe(true)
})
