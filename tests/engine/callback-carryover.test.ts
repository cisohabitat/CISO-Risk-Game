import { describe, expect, it } from 'vitest'
import { newGame, applyAction, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { createNextYear, nextYearBudget, YEAR_SHIFT } from '@/game/engine/next-year'
import { finishYear } from '@/game/debrief/review'
import { CAMPAIGN_DAYS, SAVE_SCHEMA_VERSION } from '@/game/types'
import { migrateSave } from '@/store/migrations'
import { testIndex } from './helpers'

const index = testIndex()

describe('replies to commitments made near year end', () => {
  it('judges late risk-led priorities against papers from the year that made the commitment', () => {
    const state = newGame(index, { seed: 'late-priorities-papers' })
    state.currentDay = 350
    expect(applyAction(state, index, {
      type: 'completeQuarterReview', quarter: 3, topics: [], recommendations: [], communicateUncertainty: true,
    }).ok).toBe(true)
    const decision = openDecision(state, index, 'dec-q4-priorities')!
    expect(applyAction(state, index, {
      type: 'resolveDecision', decisionId: decision.id,
      optionId: 'opt-q4-priorities-risks', rationaleTagIds: ['rat-material'],
    }).ok).toBe(true)
    state.currentDay = CAMPAIGN_DAYS
    finishYear(state, index)
    const next = createNextYear(index, state)
    runDays(next, index, 6)
    expect(next.inbox.messages.some((message) => message.eventId === 'evt-con-priorities-risks')).toBe(true)
    expect(next.inbox.messages.some((message) => message.eventId === 'evt-con-priorities-risks-unheard')).toBe(false)
  })

  it('delivers a late priorities reply after save reload without retaining annual flags globally', () => {
    const state = newGame(index, { seed: 'late-priorities' })
    state.currentDay = 350
    const decision = openDecision(state, index, 'dec-q4-priorities')!
    expect(applyAction(state, index, {
      type: 'resolveDecision', decisionId: decision.id,
      optionId: 'opt-q4-priorities-unknowns', rationaleTagIds: ['rat-more-evidence'],
    }).ok).toBe(true)
    state.flags['old.unrelated'] = true
    state.currentDay = CAMPAIGN_DAYS
    finishYear(state, index)
    const next = migrateSave(JSON.parse(JSON.stringify({
      slot: 'manual', schemaVersion: SAVE_SCHEMA_VERSION,
      savedAtIso: '2026-10-20T00:00:00.000Z', campaignTitle: 'CISO: First Year',
      state: createNextYear(index, state),
    }))).state
    expect(next.flags['old.unrelated']).toBeUndefined()
    expect(next.flags['priorities.unknowns']).toBeUndefined()
    const pending = next.events.scheduled.find((entry) => entry.eventId === 'evt-con-priorities-unknowns')!
    expect(pending.day).toBe(370 - YEAR_SHIFT)
    runDays(next, index, pending.day + 1)
    expect(next.inbox.messages.filter((message) => message.eventId === pending.eventId)).toHaveLength(1)
    expect(state.flags['priorities.unknowns']).toBe(true)
    expect(state.currentDay).toBe(CAMPAIGN_DAYS)
  })

  it('keeps a carried budget reply from becoming another autumn budget decision', () => {
    const state = newGame(index, { seed: 'late-budget' })
    state.currentDay = CAMPAIGN_DAYS
    state.flags['next-year.budget'] = 'cut'
    state.events.scheduled.push({ eventId: 'evt-con-next-year-plan', day: YEAR_SHIFT + 5 })
    finishYear(state, index)
    const next = createNextYear(index, state)
    expect(next.resources.budgetTotal).toBe(state.resources.budgetTotal * 0.8)
    expect(next.flags['next-year.budget']).toBeUndefined()
    expect(nextYearBudget(next, index)).toBe(state.resources.budgetTotal)
    runDays(next, index, 6)
    expect(next.inbox.messages.some((message) => message.eventId === 'evt-con-next-year-plan')).toBe(true)
  })

  it('still checks present capability before delivering a carried audit reply', () => {
    const state = newGame(index, { seed: 'late-audit' })
    state.currentDay = CAMPAIGN_DAYS
    state.flags['audit.on-track'] = true
    state.events.scheduled.push(
      { eventId: 'evt-con-audit-overstated', day: YEAR_SHIFT + 5 },
      { eventId: 'evt-con-audit-borne-out', day: YEAR_SHIFT + 5 },
    )
    finishYear(state, index)
    const next = createNextYear(index, state)
    const programme = next.programmes.programmes['prog-identity']!
    programme.status = 'complete'
    programme.progress = 1
    programme.completedDay = 0
    programme.completedMilestoneIds = index.programme.get(programme.id)!.milestones.map((milestone) => milestone.id)
    runDays(next, index, 6)
    expect(next.inbox.messages.some((message) => message.eventId === 'evt-con-audit-borne-out')).toBe(true)
    expect(next.inbox.messages.some((message) => message.eventId === 'evt-con-audit-overstated')).toBe(false)
  })
})
