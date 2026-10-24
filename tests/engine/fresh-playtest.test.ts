import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { evaluateAll } from '@/game/events/conditions'
import { materialTopics, buildQuarterReview } from '@/game/debrief/quarter'
import { briefing, cameBack, messageReturnKind, programmeViews, teamView } from '@/store/selectors'
import { openDecision } from '@/game/decisions/open'
import { pushMessage } from '@/game/inbox/messages'
import { meetingAccount } from '@/game/stakeholders/meeting'
import { testIndex } from './helpers'

const index = testIndex()

describe('fresh campaign follow-through', () => {
  it('keeps the independent check date when a programme completes after a production test', () => {
    const state = newGame(index, { seed: 'fresh-restore' })
    state.currentDay = 216
    applyEffects(state, [{ type: 'control.assess', controlId: 'ctl-backup' }], { index, rng: createRng('fresh', 0), source: 'test' })
    Object.assign(state.programmes.programmes['prog-ransomware']!, { status: 'complete', progress: 1, completedDay: 217 })
    state.currentDay = 245
    expect(briefing(state, index).recoveryNote).toContain('Last independently checked 5 August')
    expect(briefing(state, index).recoveryNote).not.toContain('not checked')
    applyEffects(state, [{ type: 'control.assess', controlId: 'ctl-backup' }], { index, rng: createRng('fresh', 0), source: 'test' })
    expect(briefing(state, index).recoveryNote).toBeUndefined()
  })

  it('defers a planned outage request during an incident but retains early eligibility', () => {
    const state = newGame(index, { seed: 'fresh-window' })
    state.currentDay = 210
    state.programmes.programmes['prog-ransomware']!.progress = 0.8
    const event = index.event.get('evt-q4-recovery-window')!
    expect(evaluateAll(state, index, event.conditions)).toBe(true)
    state.incidents.incidents['inc-test'] = { id: 'inc-test', familyId: 'inc-platform-tamper', phase: 'recovery' } as typeof state.incidents.incidents[string]
    expect(evaluateAll(state, index, event.conditions)).toBe(false)
    const decision = openDecision(state, index, 'dec-q4-recovery-window')!
    state.stakeholders.stakeholders['stk-coo']!.trust = 0.8
    const refused = applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-q4-recovery-now', rationaleTagIds: ['rat-more-evidence'] })
    expect(refused.ok).toBe(false)
    expect(state.flags['recovery.tested']).toBeUndefined()
    state.incidents.incidents['inc-test']!.phase = 'closed'
    expect(evaluateAll(state, index, event.conditions)).toBe(true)
    state.programmes.programmes['prog-ransomware']!.progress = 0.79
    expect(evaluateAll(state, index, event.conditions)).toBe(false)
  })

  it('recognises both authored SOC hunt replies, without guessing from ordinary mail', () => {
    const state = newGame(index, { seed: 'fresh-hunt' })
    for (const eventId of ['evt-thr-hunt-found', 'evt-thr-hunt-clean']) {
      const event = index.event.get(eventId)!
      const message = pushMessage(state, { from: event.from, subject: event.title, body: event.body, type: event.type, eventId })
      expect(messageReturnKind(message, index)).toBe('consequence')
      message.read = true
      expect(messageReturnKind(message, index)).toBe('consequence')
    }
    const ordinary = pushMessage(state, { from: 'SOC', subject: 'A hunt found something', body: 'Routine update.', type: 'threat' })
    expect(messageReturnKind(ordinary, index)).toBeUndefined()
  })

  it('requires a blocked programme on the agenda, while routine variance remains optional', () => {
    const state = newGame(index, { seed: 'fresh-board' })
    const programme = state.programmes.programmes['prog-identity']!
    programme.status = 'at-risk'
    const id = `programme:${programme.id}`
    expect(materialTopics(state, index).find((topic) => topic.id === id)?.material).toBe(false)
    programme.blockers.push({ id: index.programme.get(programme.id)!.blockers[0]!.id, startedDay: 10, resolved: false })
    expect(materialTopics(state, index).find((topic) => topic.id === id)?.material).toBe(true)
    const topics = materialTopics(state, index).filter((topic) => topic.material).map((topic) => topic.id)
    expect(buildQuarterReview(state, index, { quarter: 1, topics, recommendations: [], communicateUncertainty: true }).boardReaction).toContain('supports the direction')
    programme.blockers[0]!.resolved = true
    expect(materialTopics(state, index).find((topic) => topic.id === id)?.material).toBe(false)
  })

  it('shows vacancy counts and arrival dates for both recruitment paths', () => {
    const state = newGame(index, { seed: 'fresh-hire' })
    state.pendingEffects.push({ id: 'hire-ui', day: 60, source: 'hire', effects: [{ type: 'team.vacancyFilled', fn: 'iam' }] }, { id: 'hire-decision', day: 80, source: 'decision:recruit', effects: [{ type: 'team.vacancyFilled', fn: 'iam' }] })
    const iam = teamView(state, index).functions.find((fn) => fn.fn === 'iam')!
    expect(iam.vacancies).toBe(2)
    expect(iam.incoming).toBe(2)
    expect(iam.arrivingDays).toEqual([60, 80])
  })

  it('groups recorded returns, preserves unlinked legacy notices and keeps other results visible', () => {
    const state = newGame(index, { seed: 'fresh-returns' })
    state.inbox.messages = []
    const draft = { from: 'Programme office', body: 'Recorded delivery.', type: 'programme' as const, returnGroup: 'programme:prog-ransomware' }
    const milestone = pushMessage(state, { ...draft, subject: 'Milestone: Programme complete' })
    const delivered = pushMessage(state, { ...draft, subject: 'Delivered: Recovery' })
    pushMessage(state, { ...draft, returnGroup: undefined, subject: 'Milestone: Programme complete' })
    const result = cameBack(state, index)
    expect(result).toHaveLength(2)
    expect(result.find((item) => item.id === delivered.id)?.related).toEqual([{ id: milestone.id, subject: milestone.subject }])
    expect(state.inbox.messages).toHaveLength(3)
    delivered.read = true
    expect(cameBack(state, index).some((item) => item.id === milestone.id)).toBe(true)
  })

  it('records actual scheduled decision provenance and keeps it on delivered replies', () => {
    const state = newGame(index, { seed: 'fresh-group' })
    const source = 'decision:dec-anomaly-response'
    applyEffects(state, [{ type: 'event.schedule', eventId: 'evt-thr-hunt-clean', dayOffset: 1 }], { index, rng: createRng('fresh', 0), source })
    expect(state.events.scheduled[0]?.returnGroup).toBe(`1:${source}`)
    runDays(state, index, 1)
    expect(state.inbox.messages.find((message) => message.eventId === 'evt-thr-hunt-clean')?.returnGroup).toBe(`1:${source}`)
  })

  it('reserves 100 percent for a completed programme', () => {
    const state = newGame(index, { seed: 'fresh-rounding' })
    const programme = state.programmes.programmes['prog-ransomware']!
    Object.assign(programme, { status: 'active', progress: 0.999 })
    expect(programmeViews(state, index).find((view) => view.id === programme.id)?.progressPercent).toBe(99)
    programme.status = 'complete'
    expect(programmeViews(state, index).find((view) => view.id === programme.id)?.progressPercent).toBe(100)
  })

  it('retains the deadline and discovered dependencies in executive history', () => {
    const state = newGame(index, { seed: 'fresh-meeting' })
    const account = meetingAccount(state, index, 'stk-cio', 'listen', true)
    expect(account.memory).toContain('due ')
    expect(account.memory).toContain('It rests on ')
    expect(account.message).toContain(account.memory.split('You asked about the plan to ')[1])
  })
})
