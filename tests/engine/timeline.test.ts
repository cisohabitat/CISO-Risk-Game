import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { yearTimeline } from '@/store/selectors'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * The year timeline is derived, not stored, so these guard the derivation: that
 * it says what happened, that it never reaches past what the player saw, and
 * that a lane which fires for nobody would be caught rather than shipped.
 */
function playEngaged(seed: string): GameState {
  const index = testIndex()
  const state = newGame(index, { seed })
  const programmes = ['prog-identity', 'prog-ransomware']
  const enquiries = ['inv-service-review', 'inv-access-review']
  for (const id of [...programmes, ...enquiries]) {
    if (!index.programme.get(id) && !index.investigation.get(id)) throw new Error(`${id} is not a real id`)
  }
  let started = 0
  let commissioned = 0
  for (let day = 0; day < 364; day += 1) {
    runDays(state, index, 1)
    for (const decisionId of [...state.decisions.openIds]) {
      const runtime = state.decisions.decisions[decisionId]!
      const def = index.decision.get(runtime.defId)!
      applyAction(state, index, {
        type: 'resolveDecision',
        decisionId,
        optionId: def.options[0]!.id,
        rationaleTagIds: ['rat-more-evidence'],
      })
    }
    if (commissioned < enquiries.length && day % 60 === 10) {
      for (const leader of index.content.leaders) {
        if (applyAction(state, index, { type: 'startInvestigation', investigationId: enquiries[commissioned]!, leaderId: leader.id }).ok) {
          commissioned += 1
          break
        }
      }
    }
    if (started < programmes.length && !Object.values(state.programmes.programmes).some((p) => p.status === 'active')) {
      const def = index.programme.get(programmes[started]!)!
      if (applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok) started += 1
    }
  }
  return state
}

describe('the year timeline', () => {
  it('has a lane for each thing a year is made of', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tl-lanes' })
    runDays(state, index, 364)
    expect(yearTimeline(state, index).map((lane) => lane.id)).toEqual([
      'decisions',
      'programmes',
      'enquiries',
      'board',
      'assumptions',
      'incidents',
    ])
  })

  it('draws a lapsed decision as a gap, not as a choice', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tl-lapse' })
    runDays(state, index, 364)

    const decisions = yearTimeline(state, index).find((lane) => lane.id === 'decisions')!
    const lapsed = decisions.marks.filter((mark) => !mark.present)
    expect(lapsed.length, 'an idle year lapsed nothing — the assertion never ran').toBeGreaterThan(0)
    expect(decisions.summary).toContain('decided for you')
    // Every lapse in the lane is a lapse in the record.
    const recorded = Object.values(state.decisions.decisions).filter((d) => d.resolvedByDefault).length
    expect(lapsed).toHaveLength(recorded)
  })

  it('shows what an engaged player built, with the days they built it on', () => {
    const index = testIndex()
    const state = playEngaged('tl-engaged')
    const lanes = yearTimeline(state, index)

    const programmes = lanes.find((lane) => lane.id === 'programmes')!
    expect(programmes.spans.length).toBeGreaterThan(0)
    for (const span of programmes.spans) {
      expect(span.fromDay).toBeGreaterThanOrEqual(0)
      expect(span.toDay).toBeGreaterThanOrEqual(span.fromDay)
    }

    expect(lanes.find((lane) => lane.id === 'enquiries')!.marks.length).toBeGreaterThan(0)
    const decisions = lanes.find((lane) => lane.id === 'decisions')!
    expect(decisions.marks.every((mark) => mark.day >= 0 && mark.day <= 364)).toBe(true)
  })

  it('names things in the words the player already saw', () => {
    const index = testIndex()
    const state = playEngaged('tl-words')
    const lanes = yearTimeline(state, index)
    const labels = lanes.flatMap((lane) => [...lane.marks.map((m) => m.label), ...lane.spans.map((s) => s.label)])

    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      // Never an internal id, and never an empty mark nobody can read.
      expect(label.length).toBeGreaterThan(2)
      expect(label).not.toMatch(/^(dec|prog|inv|inc|asm)-/)
    }
  })

  it('reaches nothing the player was not told', () => {
    // The lane a leak would arrive through is incidents: the attack path behind
    // one is hidden state. Only the family name and the day are used.
    const index = testIndex()
    const state = playEngaged('tl-hidden')
    const incidents = yearTimeline(state, index).find((lane) => lane.id === 'incidents')!
    const families = index.content.incidentFamilies.map((family) => family.name)
    for (const mark of incidents.marks) {
      expect(families).toContain(mark.label)
    }
    const pathNames = index.content.attackPaths.map((path) => path.name)
    for (const mark of incidents.marks) {
      expect(pathNames).not.toContain(mark.label)
    }
  })

  it('says so in words when a lane is empty rather than drawing nothing', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'tl-empty' })
    runDays(state, index, 364)
    const lanes = yearTimeline(state, index)
    for (const lane of lanes) {
      expect(lane.summary.length).toBeGreaterThan(0)
      if (lane.marks.length === 0 && lane.spans.length === 0) {
        expect(lane.summary).toMatch(/none|0 of/)
      }
    }
  })
})
