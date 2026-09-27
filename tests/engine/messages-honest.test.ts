import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'
import { evaluateAll } from '@/game/events/conditions'
import { nextBoard, renderDecisionText } from '@/game/decisions/describe'
import { patternSuggestions } from '@/store/selectors'
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
        // Two incidents of one family can run at once, so a date window read
        // the other one's count: take this incident's own closing message, the
        // one posted the day it closed.
        const text = state.inbox.messages
          .filter((m) => m.type === 'incident' && m.subject === `${family.name}: closed`)
          .filter((m) => m.day === incident.phaseEnteredDay)
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

describe('messages about controls', () => {
  it('does not say endpoint coverage went backwards while the detection programme is raising it', () => {
    for (const seed of ['drift-1', 'drift-2', 'drift-3']) {
      const state = newGame(index, { seed })
      const def = index.programme.get('prog-detection')!
      const running: number[] = []
      for (let day = 0; day < 364; day += 1) {
        answerAll(state)
        if (day === 140) applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
        for (const blocker of state.programmes.programmes[def.id]?.blockers ?? []) {
          if (!blocker.resolved) applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: def.id, blockerId: blocker.id })
        }
        runDays(state, index, 1)
        const status = state.programmes.programmes[def.id]?.status
        if (status === 'active' || status === 'at-risk') running.push(state.currentDay)
      }
      expect(running.length, `${seed}: the programme never ran`).toBeGreaterThan(60)
      const drift = state.inbox.messages.filter((m) => m.eventId === 'evt-org-control-drift').map((m) => m.day)
      expect(drift.filter((day) => running.includes(day)), `${seed}: drift reported while the programme ran`).toEqual([])
    }
  })
})

describe('reports the player has already overtaken', () => {
  it('does not have a colleague discover a finding the player already holds', () => {
    // The recovery test enquiry guarantees the same evidence as the message in
    // which Jo "went looking for the last recovery test report".
    for (const seed of ['overtaken-1', 'overtaken-2']) {
      const state = newGame(index, { seed })
      applyAction(state, index, {
        type: 'startInvestigation', investigationId: 'inv-recovery-test', leaderId: index.content.leaders[0]!.id,
      })
      for (let day = 0; day < 200; day += 1) {
        answerAll(state)
        runDays(state, index, 1)
      }
      const known = state.evidence.items['ev-backup-test-failed']
      expect(known, `${seed}: the enquiry did not find it`).toBeDefined()
      const told = state.inbox.messages.filter((m) => m.eventId === 'evt-org-backup-test')
      expect(told.filter((m) => m.day > known!.discoveredDay), `${seed}: reported after the player had it`).toEqual([])
    }
  })

  it('still sends the report to a player who does not have it', () => {
    const sent = ['overtaken-1', 'overtaken-2', 'overtaken-3', 'overtaken-4'].filter((seed) => {
      const state = newGame(index, { seed })
      for (let day = 0; day < 250; day += 1) {
        answerAll(state)
        runDays(state, index, 1)
      }
      return state.inbox.messages.some((m) => m.eventId === 'evt-org-backup-test')
    })
    expect(sent.length).toBeGreaterThan(0)
  })
})

describe('messages about the calendar', () => {
  it('does not call three months quiet a fortnight after an incident closed', () => {
    const quiet = index.event.get('evt-biz-good-quarter')!
    const state = newGame(index, { seed: 'quiet-quarter' })
    state.currentDay = 240
    state.incidents.incidents['inc-arranged'] = {
      ...({} as GameState['incidents']['incidents'][string]),
      id: 'inc-arranged', familyId: 'arranged', startedDay: 200, phase: 'closed', phaseEnteredDay: 226, resolvedDay: 226,
    }
    const holds = () => evaluateAll(state, index, quiet.conditions.filter((c) => c.kind.startsWith('incident')))
    expect(holds(), 'fourteen days after an incident closed').toBe(false)
    state.currentDay = 226 + 91
    expect(holds(), 'ninety-one days after').toBe(true)
    state.incidents.incidents['inc-arranged']!.phase = 'containment'
    expect(holds(), 'while one is running').toBe(false)
  })

  it('announces the Nordic partner while there is still time to integrate before entry', () => {
    const def = index.event.get('evt-biz-nordic-partner')!
    const target = index.content.objectives.find((o) => o.id === 'obj-new-market')!.targetDay
    // "Integration work starts next month."
    expect(def.availableUntilDay).toBeDefined()
    expect(def.availableUntilDay! + 30).toBeLessThan(target - 45)
  })
})

describe('decisions that name a date', () => {
  it('says when the board next meets from the day it is asked, not from when it was written', () => {
    expect(nextBoard(70)).toBe('in three weeks')
    expect(nextBoard(84)).toBe('next week')
    expect(nextBoard(89)).toBe('this week')
    expect(nextBoard(100)).toBe('in twelve weeks')
    expect(nextBoard(280)).toBe('not until the new year')
    const def = index.decision.get('dec-board-material-risk')!
    const state = newGame(index, { seed: 'next-board' })
    state.currentDay = 70
    expect(renderDecisionText(def.description, state, index)).toContain('The next scheduled meeting is in three weeks.')
    state.currentDay = 93
    state.reviews.pendingQuarter = 1
    expect(renderDecisionText(def.description, state, index)).toContain('The next scheduled meeting is this week.')
    expect(JSON.stringify(def)).not.toMatch(/six weeks is not long/i)
  })

  it('does not offer to act before a freeze the decision can arrive during', () => {
    // The enforcement decision waits for the identity programme, which can
    // finish after the freeze begins on day 270.
    const def = index.decision.get('dec-q4-identity-enforce')!
    expect(JSON.stringify(def)).not.toMatch(/before the (peak-trading change )?freeze/i)
  })
})

describe('messages about a weakness the player has since fixed', () => {
  const cases: [string, string, string][] = [
    ['evt-org-cloud-public-bucket', 'prog-cloud', 'complete'],
    ['evt-org-k8s-permissions', 'prog-cloud', 'complete'],
    ['evt-org-backup-test', 'prog-ransomware', 'complete'],
    ['evt-thr-escalation-quality', 'prog-detection', 'complete'],
    ['evt-org-pam-adoption', 'prog-identity', 'active'],
    ['evt-org-service-accounts', 'prog-identity', 'complete'],
    ['evt-org-mfa-exceptions', 'prog-identity', 'complete'],
  ]
  for (const [eventId, programmeId, status] of cases) {
    it(`${eventId} is not sent once ${programmeId} is ${status}`, () => {
      const def = index.event.get(eventId)!
      const state = newGame(index, { seed: `fixed-${eventId}` })
      state.currentDay = def.availableFromDay
      expect(evaluateAll(state, index, def.conditions), 'not true to begin with').toBe(true)
      const programme = index.programme.get(programmeId)!
      expect(applyAction(state, index, { type: 'startProgramme', programmeId, budget: programme.budgetCost }).ok).toBe(true)
      state.programmes.programmes[programmeId]!.status = status as 'active' | 'complete'
      expect(evaluateAll(state, index, def.conditions)).toBe(false)
    })
  }

  it('holds reports with conditions of their own to the same guard', () => {
    for (const [eventId, programmeId] of [
      ['evt-org-pipeline-credentials', 'prog-cloud'],
      ['evt-org-supplier-contradiction', 'prog-thirdparty'],
    ] as const) {
      const guard = JSON.stringify(index.event.get(eventId)!.conditions)
      expect(guard, eventId).toContain(`"kind":"not","condition":{"kind":"programme.status","programmeId":"${programmeId}","status":"complete"}`)
    }
  })

  it('still spreads them across the year rather than sending each the day it becomes possible', () => {
    // A guard that only closes a message used to take it out of the pacing.
    const days: number[] = []
    for (let i = 0; i < 12; i += 1) {
      const state = newGame(index, { seed: `spread-${i}` })
      runDays(state, index, 364)
      const day = state.inbox.messages.find((m) => m.eventId === 'evt-org-cloud-public-bucket')?.day
      if (day !== undefined) days.push(day)
    }
    days.sort((a, b) => a - b)
    expect(days.length).toBeGreaterThan(8)
    // Unpaced, it arrived by day 64 in every year, median 39.
    expect(days[Math.floor(days.length / 2)]!, `days ${days.join(', ')}`).toBeGreaterThan(50)
    expect(days.at(-1)!, `days ${days.join(', ')}`).toBeGreaterThan(100)
  })
})

describe('an enquiry coming back', () => {
  it('says what it found, not only how well it went', () => {
    const state = newGame(index, { seed: 'enquiry-back' })
    applyAction(state, index, { type: 'startInvestigation', investigationId: 'inv-recovery-test', leaderId: index.content.leaders[0]!.id })
    for (let day = 0; day < 40; day += 1) {
      answerAll(state)
      runDays(state, index, 1)
    }
    const back = state.inbox.messages.find((m) => m.subject === 'Completed: Recovery test for a critical service')
    expect(back, 'the enquiry never came back').toBeDefined()
    const guaranteed = index.evidence.get('ev-backup-test-failed')!.title
    expect(back!.body).toMatch(new RegExp(`What came back: .*${guaranteed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|confirmed what you already had`))
  })
})

describe('the fourth-quarter follow-ups', () => {
  // Each new late-year choice answers back, and each answer is reachable. A
  // year is played preferring the earlier choices that open these decisions.
  const earlier = { 'dec-acquisition-integration': 'opt-acq-quarantine', 'dec-audit-finding': 'opt-audit-programme' }
  const cases: [string, string, string[]][] = [
    ['dec-q4-corvus-terms', 'opt-q4-corvus-terms', ['evt-con-corvus-terms-written']],
    ['dec-q4-corvus-terms', 'opt-q4-corvus-renew', ['evt-con-corvus-old-paper']],
    ['dec-q4-corvus-terms', 'opt-q4-corvus-tender', ['evt-con-corvus-tender']],
    ['dec-q4-kestrel-release', 'opt-q4-kestrel-lift', ['evt-con-kestrel-lifted']],
    ['dec-q4-kestrel-release', 'opt-q4-kestrel-review', ['evt-con-kestrel-reviewed']],
    ['dec-q4-kestrel-release', 'opt-q4-kestrel-hold', ['evt-con-kestrel-held']],
    ['dec-q4-audit-followup', 'opt-q4-audit-show', ['evt-con-audit-shown']],
    ['dec-q4-audit-followup', 'opt-q4-audit-ontrack', ['evt-con-audit-overstated', 'evt-con-audit-borne-out']],
    ['dec-q4-audit-followup', 'opt-q4-audit-rescope', ['evt-con-audit-rescoped']],
    ['dec-q4-priorities', 'opt-q4-priorities-risks', ['evt-con-priorities-risks']],
    ['dec-q4-priorities', 'opt-q4-priorities-unknowns', ['evt-con-priorities-unknowns']],
  ]
  for (const [decisionId, optionId, replies] of cases) {
    it(`${optionId} is answered`, () => {
      const state = newGame(index, { seed: `q4-${optionId}` })
      for (let day = 0; day < 364; day += 1) {
        answerAll(state, { ...earlier, [decisionId]: optionId })
        // Raise what the game notices: the priorities decision is only put to
        // a player who has raised a risk.
        const offered = patternSuggestions(state, index)[0]
        if (offered && applyAction(state, index, { type: 'createHypothesis', templateId: offered.templateId, evidenceIds: offered.evidence.map((e) => e.id) }).ok) {
          applyAction(state, index, { type: 'convertHypothesis', hypothesisId: Object.keys(state.risks.hypotheses).at(-1)! })
        }
        runDays(state, index, 1)
      }
      const taken = Object.values(state.decisions.decisions).find((d) => d.defId === decisionId)
      expect(taken, `${decisionId} never opened`).toBeDefined()
      expect(taken!.selectedOptionId, `${optionId} could not be taken`).toBe(optionId)
      const arrived = state.inbox.messages.filter((m) => replies.includes(m.eventId ?? ''))
      expect(arrived.length, `no reply to ${optionId}`).toBe(1)
    })
  }

  it('does not say the audit found the programme on track unless it was', () => {
    const overstated = index.event.get('evt-con-audit-overstated')!
    const borne = index.event.get('evt-con-audit-borne-out')!
    const state = newGame(index, { seed: 'audit-truth' })
    state.flags['audit.on-track'] = true
    expect(evaluateAll(state, index, overstated.conditions)).toBe(true)
    expect(evaluateAll(state, index, borne.conditions)).toBe(false)
    const def = index.programme.get('prog-identity')!
    applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
    state.programmes.programmes['prog-identity']!.status = 'complete'
    expect(evaluateAll(state, index, overstated.conditions)).toBe(false)
    expect(evaluateAll(state, index, borne.conditions)).toBe(true)
  })
})

describe('who a message is from, in play', () => {
  it('signs every person the same way, whether content or the engine wrote it', () => {
    // The content test holds authored events; enquiry and programme messages
    // are built by the engine, and signed "Stefan Alvarez" beside "Stefan
    // Alvarez, Head of Security Architecture".
    const people = [...index.content.stakeholders, ...index.content.leaders].map((p) => ({ name: p.name, full: `${p.name}, ${p.role}` }))
    const state = newGame(index, { seed: 'signed' })
    for (let day = 0; day < 200; day += 1) {
      if (day === 3) {
        const investigation = index.content.investigations[0]!
        applyAction(state, index, { type: 'startInvestigation', investigationId: investigation.id, leaderId: index.content.leaders[0]!.id })
      }
      runDays(state, index, 1)
    }
    const signed = state.inbox.messages.filter((m) => people.some((p) => m.from.startsWith(p.name)))
    expect(signed.some((m) => !m.eventId), 'no engine-built message from a person was sent').toBe(true)
    for (const m of signed) {
      const person = people.find((p) => m.from.startsWith(p.name))!
      expect(m.from, m.subject).toBe(person.full)
    }
  })
})

describe('a business objective that misses its date', () => {
  it('is announced on the day it fails, by the executive who owns it', () => {
    // Delivery and slipping had notices; failure had none, and the first a
    // player heard of it was "Launch the new customer platform: failed" in
    // the annual review.
    const state = newGame(index, { seed: 'missed' })
    runDays(state, index, 30)
    const def = index.content.objectives[0]!
    const runtime = state.business.objectives[def.id]!
    runtime.targetDay = state.currentDay
    runDays(state, index, 1)
    expect(runtime.status).toBe('failed')
    const owner = index.stakeholder.get(def.ownerStakeholderId!)!
    const notice = state.inbox.messages.find((m) => m.subject === `Missed: ${def.name}`)
    expect(notice, `${def.id} failed in silence`).toBeDefined()
    expect(notice!.day).toBe(state.currentDay)
    expect(notice!.from).toBe(`${owner.name}, ${owner.role}`)
  })
})
