import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'

// Owner, 22 November: a blocker with a price holds a programme short of
// completion until it is paid for. Identity finished without its £120k shim
// in three playtest rounds.
it('holds a programme at 90% while a paid blocker stands, then finishes once it is paid', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'paid-blocker' })
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: index.programme.get('prog-identity')!.budgetCost }).ok).toBe(true)
  const programme = state.programmes.programmes['prog-identity']!
  programme.progress = 0.88
  programme.blockers.push({ id: 'blk-identity-legacy', startedDay: state.currentDay, resolved: false })
  for (let day = 0; day < 120; day += 1) runDays(state, index, 1)
  expect(programme.status).not.toBe('complete')
  expect(programme.progress).toBe(0.9)
  expect(state.inbox.messages.filter((m) => m.subject === `Held short of completion: ${index.programme.get('prog-identity')!.name}`).length).toBe(1)
  state.resources.budgetRemaining = Math.max(state.resources.budgetRemaining, 500)
  expect(applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: 'prog-identity', blockerId: 'blk-identity-legacy' }).ok).toBe(true)
  for (let day = 0; day < 120 && programme.status !== 'complete'; day += 1) runDays(state, index, 1)
  expect(programme.status).toBe('complete')
})

it('still lets a programme finish past a blocker that has no price', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'unpaid-blocker' })
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-cloud', budget: index.programme.get('prog-cloud')!.budgetCost }).ok).toBe(true)
  const programme = state.programmes.programmes['prog-cloud']!
  programme.progress = 0.95
  programme.blockers.push({ id: 'blk-cloud-velocity', startedDay: state.currentDay, resolved: false })
  for (let day = 0; day < 200 && programme.status !== 'complete'; day += 1) runDays(state, index, 1)
  expect(programme.status).toBe('complete')
})
