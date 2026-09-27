import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview } from '@/game/debrief/review'
import type { GameState } from '@/game/types'
import { testIndex } from './helpers'

/**
 * Starting situations: the same organisation, a different year. Each is data —
 * a budget and a handful of effects through the one reducer — plus messages
 * gated on `situation.is`.
 */
const index = testIndex()
const situations = index.content.situations ?? []

describe('starting situations', () => {
  it('are offered, and the usual opening is the first and changes nothing', () => {
    expect(situations.length).toBeGreaterThanOrEqual(4)
    const plain = newGame(index, { seed: 'sit-plain' })
    const usual = newGame(index, { seed: 'sit-plain', situation: situations[0]!.id })
    expect(situations[0]!.setupEffects).toEqual([])
    expect(usual.resources.budgetTotal).toBe(plain.resources.budgetTotal)
    expect(usual.stakeholders.boardConfidence).toBe(plain.stakeholders.boardConfidence)
    expect(usual.situationId).toBe(situations[0]!.id)
    expect(plain.situationId).toBeUndefined()
  })

  it('set the year up as they say, with total and remaining budget in step', () => {
    const plain = newGame(index, { seed: 'sit-setup' })
    for (const def of situations.slice(1)) {
      const state = newGame(index, { seed: 'sit-setup', situation: def.id })
      expect(state.situationId).toBe(def.id)
      expect(state.resources.budgetTotal, def.id).toBe(plain.resources.budgetTotal + (def.budgetDelta ?? 0))
      expect(state.resources.budgetRemaining, def.id).toBe(state.resources.budgetTotal)
    }
    const breach = newGame(index, { seed: 'sit-setup', situation: 'sit-after-breach' })
    expect(breach.stakeholders.boardConfidence).toBeLessThan(plain.stakeholders.boardConfidence)
    const tidy = newGame(index, { seed: 'sit-setup', situation: 'sit-tidy' })
    expect(tidy.controls.controls['ctl-mfa']!.coverage).toBeGreaterThan(plain.controls.controls['ctl-mfa']!.coverage)
  })

  it('draws a surprise from the seed: the same seed, the same situation, and every one reachable', () => {
    const drawn = new Set<string>()
    for (let i = 0; i < 40; i += 1) {
      const a = newGame(index, { seed: `surprise-${i}`, situation: 'surprise' })
      const b = newGame(index, { seed: `surprise-${i}`, situation: 'surprise' })
      expect(a.situationId).toBe(b.situationId)
      drawn.add(a.situationId!)
    }
    expect(drawn.size).toBe(situations.length)
  })

  it('opens with its own message, and only in its own year', () => {
    const openings: Record<string, string> = {
      'sit-after-breach': 'evt-sit-breach-opening',
      'sit-new-money': 'evt-sit-money-opening',
      'sit-tidy': 'evt-sit-tidy-opening',
    }
    for (const def of situations) {
      const state = newGame(index, { seed: 'sit-open', situation: def.id })
      runDays(state, index, 3)
      const got = state.inbox.messages.map((m) => m.eventId)
      for (const [situationId, eventId] of Object.entries(openings)) {
        expect(got.includes(eventId), `${def.id} / ${eventId}`).toBe(situationId === def.id)
      }
    }
  })

  it('does not send a message the situation contradicts', () => {
    const contradicted: Record<string, string[]> = {
      'sit-tidy': ['evt-org-backup-test', 'evt-org-pam-adoption'],
      'sit-after-breach': ['evt-org-ir-plan', 'evt-biz-competitor-breach'],
    }
    for (const [situationId, eventIds] of Object.entries(contradicted)) {
      for (const seed of ['contra-1', 'contra-2', 'contra-3']) {
        const state = newGame(index, { seed, situation: situationId })
        runDays(state, index, 364)
        const got = state.inbox.messages.map((m) => m.eventId)
        for (const eventId of eventIds) expect(got, `${situationId} sent ${eventId}`).not.toContain(eventId)
      }
    }
  })
})

describe('the close answers the question the situation asked', () => {
  const review = (state: ReturnType<typeof newGame>) => buildAnnualReview(state, index).narrative.join(' ')

  it('says whether the breach happened again', () => {
    const state = newGame(index, { seed: 'close-breach', situation: 'sit-after-breach' })
    expect(review(state)).toContain('This year, it did not.')
    state.incidents.incidents['inc-again'] = {
      ...({} as GameState['incidents']['incidents'][string]),
      id: 'inc-again', familyId: 'fam-ransomware', startedDay: 212, consequence: 0.2, phase: 'closed', phaseEnteredDay: 240,
      resolvedDay: 240, affectedServiceIds: [], decisionsTaken: [],
    }
    expect(review(state)).toContain('It did: ransomware again on day 212.')
  })

  it('says what the new money bought', () => {
    const state = newGame(index, { seed: 'close-money', situation: 'sit-new-money' })
    expect(review(state)).toContain('and started no programme with it')
    const def = index.programme.get('prog-identity')!
    applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
    expect(review(state)).toMatch(/1 programme was started with it and 0 finished/)
  })

  it('says how much of the tidy inheritance was checked', () => {
    const state = newGame(index, { seed: 'close-tidy', situation: 'sit-tidy' })
    expect(review(state)).toMatch(/took all 4 your predecessor had improved on trust/)
    state.currentDay = 40
    state.controls.controls['ctl-mfa']!.believed!.assessedOnDay = 30
    expect(review(state)).toContain('Of the 4 your predecessor had improved, you checked 1 for yourself.')
  })

  it('says nothing of the kind in the usual year', () => {
    const state = newGame(index, { seed: 'close-usual', situation: 'sit-inherited-mess' })
    expect(review(state)).not.toMatch(/You arrived after a breach|You were given|You inherited better controls/)
  })
})
