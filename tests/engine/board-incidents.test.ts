import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'

// Owner, 19 November: the board is incident-aware. It reacts to how it was
// told, not to the incident alone.
function live(seed: string) {
  const index = testIndex()
  const state = newGame(index, { seed })
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  const incident = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
  incident.detectionDay = state.currentDay
  let guard = 0
  while (incident.responseStartedDay === undefined && guard++ < 10) runDays(state, index, 1)
  return { state, index, incident }
}

it('hears elsewhere three days into a response nobody briefed, once', () => {
  const { state, index, incident } = live('board-elsewhere')
  const before = state.stakeholders.boardConfidence
  runDays(state, index, 3)
  expect(incident.boardHeardElsewhereDay).toBeDefined()
  expect(state.stakeholders.boardConfidence).toBeLessThan(before - 0.05)
  runDays(state, index, 3)
  expect(state.inbox.messages.filter((m) => m.subject.includes('heard about the ransomware') && m.subject.endsWith('elsewhere')).length).toBe(1)
})

it('takes a briefing within the window, for one attention, and does not hear elsewhere', () => {
  const { state, index, incident } = live('board-briefed')
  const focus = state.resources.focusRemaining
  expect(applyAction(state, index, { type: 'briefBoard', incidentId: incident.id }).ok).toBe(true)
  expect(state.resources.focusRemaining).toBe(focus - 1)
  expect(applyAction(state, index, { type: 'briefBoard', incidentId: incident.id }).ok).toBe(false)
  runDays(state, index, 5)
  expect(incident.boardHeardElsewhereDay).toBeUndefined()
  expect(state.inbox.messages.some((m) => m.subject === 'Briefing received: the ransomware and service encryption')).toBe(true)
})

it('reads a material incident more kindly when a paper had warned of its route', () => {
  const close = (warned: boolean) => {
    const { state, index, incident } = live('board-close')
    applyAction(state, index, { type: 'briefBoard', incidentId: incident.id })
    if (warned) state.reviews.quarters.push({ quarter: 1, day: incident.startedDay - 1, topicsChosen: ['risk:risk-supplier-ransomware'], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true })
    incident.consequence = 0.8
    let before = state.stakeholders.boardConfidence
    for (let day = 0; day < 120 && incident.phase !== 'closed'; day += 1) {
      before = state.stakeholders.boardConfidence
      incident.consequence = 0.8
      runDays(state, index, 1)
    }
    expect(incident.phase).toBe('closed')
    const letter = state.inbox.messages.find((m) => m.subject === 'The committee on the ransomware and service encryption')!
    return { drop: before - state.stakeholders.boardConfidence, letter: letter.body }
  }
  const unwarned = close(false)
  const warned = close(true)
  expect(unwarned.letter).toContain('Nothing in your papers had put this route in front of it')
  expect(warned.letter).toContain('Your Q1 paper had put this route in front of it')
  expect(warned.letter).toContain('It heard about it from you first')
  expect(warned.drop).toBeLessThan(unwarned.drop)
  expect(unwarned.drop).toBeGreaterThan(0.05)
})

it('makes reassurance a wager: kinder when it holds, costlier when it does not', () => {
  const close = (tone: 'candid' | 'reassuring', consequence: number) => {
    const { state, index, incident } = live(`board-tone-${tone}-${consequence}`)
    applyAction(state, index, { type: 'briefBoard', incidentId: incident.id, tone })
    let before = state.stakeholders.boardConfidence
    for (let day = 0; day < 120 && incident.phase !== 'closed'; day += 1) {
      before = state.stakeholders.boardConfidence
      incident.consequence = consequence
      runDays(state, index, 1)
    }
    const letter = state.inbox.messages.find((m) => m.subject === 'The committee on the ransomware and service encryption')!
    return { change: state.stakeholders.boardConfidence - before, letter: letter.body }
  }
  const failed = close('reassuring', 0.8)
  const candidBad = close('candid', 0.8)
  expect(failed.letter).toContain('it was told the incident was in hand, and it was not')
  expect(failed.change).toBeLessThan(candidBad.change)
  const held = close('reassuring', 0.1)
  const candidSmall = close('candid', 0.1)
  expect(held.letter).toContain('your reassurance held')
  expect(held.change).toBeGreaterThan(candidSmall.change)
})

it('stays wary for a quarter after a material incident: warms slowly, cools as fast as ever', () => {
  const warm = (wary: boolean) => {
    const index = testIndex()
    const state = newGame(index, { seed: 'board-wary' })
    state.currentDay = 100
    state.stakeholders.boardConfidence = 0.3
    for (const person of Object.values(state.stakeholders.stakeholders)) person.trust = 0.8
    if (wary) state.stakeholders.boardWaryUntilDay = 191
    state.events.suppressedEventIds = index.content.events.map((event) => event.id)
    runDays(state, index, 60)
    return state.stakeholders.boardConfidence
  }
  expect(warm(true)).toBeLessThan(warm(false) - 0.05)
})
