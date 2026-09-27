import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * Three years were read end to end while grading. Each of these is a message
 * that said something the game had not checked, or said it on the wrong day.
 */
const index = testIndex()
const dayOf = (state: GameState, eventId: string) => state.inbox.messages.find((m) => m.eventId === eventId)?.day

function answerAll(state: GameState, prefer?: Record<string, string>) {
  for (const id of [...state.decisions.openIds]) {
    const def = index.decision.get(state.decisions.decisions[id]!.defId)!
    const preferred = prefer?.[def.id]
    const ordered = preferred ? [def.options.find((o) => o.id === preferred)!, ...def.options] : def.options
    for (const option of ordered) {
      const tags = def.rationaleTagIds?.slice(0, 1) ?? ['rat-more-evidence']
      if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: tags }).ok) break
    }
  }
}

describe('the opening spine', () => {
  it('lands each beat on its authored day rather than four days after the last', () => {
    const state = newGame(index, { seed: 'spine' })
    for (let day = 0; day < 8; day += 1) {
      answerAll(state)
      runDays(state, index, 1)
    }
    const meeting = dayOf(state, 'evt-day-one')!
    // "The CEO meeting starts in 23 minutes", then her question, the next day.
    expect(dayOf(state, 'evt-ceo-answer'), 'the CEO asked days after a meeting 23 minutes away').toBeLessThanOrEqual(meeting + 1)
    expect(dayOf(state, 'evt-team-intro'), 'the team introduced itself late').toBe(2)
    expect(dayOf(state, 'evt-register-handover')).toBe(4)
  })
})

describe('scheduled messages', () => {
  it('are sent once when they say once, however many times they were scheduled', () => {
    const state = newGame(index, { seed: 'scheduled-once' })
    state.flags['incident.external'] = true
    state.events.scheduled.push({ eventId: 'evt-con-incident-external-invoiced', day: 3 })
    state.events.scheduled.push({ eventId: 'evt-con-incident-external-invoiced', day: 6 })
    runDays(state, index, 8)
    expect(state.inbox.messages.filter((m) => m.eventId === 'evt-con-incident-external-invoiced')).toHaveLength(1)
  })

  it('are not sent when what they say has stopped being true', () => {
    const state = newGame(index, { seed: 'scheduled-conditions' })
    // Scheduled, but the flag it rests on was never set.
    state.events.scheduled.push({ eventId: 'evt-con-incident-external-invoiced', day: 3 })
    runDays(state, index, 5)
    expect(state.inbox.messages.some((m) => m.eventId === 'evt-con-incident-external-invoiced')).toBe(false)
  })
})

describe('messages that claim a state', () => {
  it('call a week quiet only when nothing urgent arrived in it', () => {
    let quiet = 0
    for (const seed of ['quiet-1', 'quiet-2', 'quiet-3', 'quiet-4']) {
      const state = newGame(index, { seed })
      runDays(state, index, 364)
      for (const m of state.inbox.messages.filter((x) => x.eventId === 'evt-org-quiet-week')) {
        quiet += 1
        const urgent = state.inbox.messages.filter(
          (x) => (x.priority === 'urgent' || x.priority === 'critical') && x.day < m.day && m.day - x.day < 7,
        )
        expect(urgent.map((x) => `d${x.day} ${x.subject}`), `a quiet week on day ${m.day}`).toEqual([])
      }
    }
    expect(quiet, 'no quiet week ever came, so nothing was tested').toBeGreaterThan(0)
  })

  it('announce a new starter only to a year that recruited, and once', () => {
    const year = (option: string) => {
      const state = newGame(index, { seed: 'new-starter' })
      for (let day = 0; day < 364; day += 1) {
        answerAll(state, { 'dec-hire-or-outsource': option })
        runDays(state, index, 1)
      }
      return state.inbox.messages.filter((m) => m.eventId === 'evt-org-new-starter').length
    }
    expect(year('opt-hire-nothing'), 'a new starter arrived for vacancies held open').toBe(0)
    expect(year('opt-hire-recruit')).toBeLessThanOrEqual(1)
  })
})

describe('incidents', () => {
  it('count only the response decisions in the closing message', () => {
    let checked = 0
    for (const seed of ['inc-1', 'inc-2', 'inc-3', 'inc-4', 'inc-5', 'inc-6']) {
      const state = newGame(index, { seed, difficulty: 'high-pressure' })
      for (let day = 0; day < 364; day += 1) {
        answerAll(state)
        runDays(state, index, 1)
      }
      for (const incident of Object.values(state.incidents.incidents)) {
        const family = index.incidentFamily.get(incident.familyId)!
        // Phase notes reach the player as inbox messages under the family's name.
        const text = state.inbox.messages
          .filter((m) => m.type === 'incident' && m.subject.startsWith(`${family.name}:`))
          .filter((m) => m.day >= incident.startedDay && m.day <= (incident.resolvedDay ?? 364))
          .map((m) => m.body)
          .join(' ')
        // The count is in the closing message, which an incident still running
        // at the close of the year has not had yet.
        if (incident.phase !== 'closed') continue
        const said = Number(text.match(/You took (\d+) response decision/)?.[1] ?? 0)
        const responses = incident.decisionsTaken.filter((t) =>
          family.responseDecisionIds.includes(state.decisions.decisions[t.decisionId]?.defId ?? ''),
        ).length
        expect(said, `${incident.familyId}: said ${said}, took ${responses}`).toBe(responses)
        checked += 1
      }
    }
    expect(checked, 'no incident closed, so nothing was counted').toBeGreaterThan(0)
  })
})
