import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

/**
 * The one-shot pool used to be spent by July: 30.6 / 25.5 / 2.4 / 0.3
 * texture events per quarter, so the second half of the inbox was
 * repeatables only. Calendar-only one-shots are now drawn at a rate that
 * keeps the reservoir in step with the days left.
 */
describe('the event draw', () => {
  it('spends calendar-only texture across the whole year', () => {
    const index = testIndex()
    const texture = new Set(
      index.content.events
        .filter((e) => e.oncePerCampaign && !e.pinned && !e.scheduledOnly && !e.decisionId
          && e.conditions.every((c) => c.kind === 'always' || c.kind === 'day.after' || c.kind === 'day.before'))
        .map((e) => e.id),
    )
    expect(texture.size).toBeGreaterThan(20)
    const perQuarter = [0, 0, 0, 0]
    const seeds = ['pace-1', 'pace-2', 'pace-3', 'pace-4', 'pace-5', 'pace-6']
    for (const seed of seeds) {
      const state = newGame(index, { seed })
      for (let day = 0; day < 364; day += 1) {
        runDays(state, index, 1)
        for (const id of [...state.decisions.openIds]) {
          const def = index.decision.get(state.decisions.decisions[id]!.defId)!
          for (const o of def.options) {
            if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: o.id, rationaleTagIds: [def.rationaleTagIds?.[0] ?? 'rat-more-evidence'] }).ok) break
          }
        }
      }
      for (const id of texture) {
        const fired = state.events.firedOnDay[id]
        if (fired !== undefined) perQuarter[Math.min(3, Math.floor(fired / 91))]! += 1
      }
    }
    const perCampaign = perQuarter.map((n) => n / seeds.length)
    // Each half of the year gets a real share, and the last quarter is not empty.
    const h1 = perCampaign[0]! + perCampaign[1]!, h2 = perCampaign[2]! + perCampaign[3]!
    expect(h2, `texture per quarter ${perCampaign.map((n) => n.toFixed(1)).join(' / ')}`).toBeGreaterThanOrEqual(h1 * 0.5)
    expect(perCampaign[3], 'the fourth quarter got no texture at all').toBeGreaterThanOrEqual(3)
    // And it is spent, not hoarded: most of it fires by the end of the year.
    expect(h1 + h2).toBeGreaterThanOrEqual(texture.size * 0.75)
  })
})

describe('a message that comes back', () => {
  it('comes back in other words', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'reworded' })
    runDays(state, index, 364)
    const byEvent = new Map<string, string[]>()
    for (const m of [...state.inbox.messages].reverse()) {
      if (!m.eventId) continue
      byEvent.set(m.eventId, [...(byEvent.get(m.eventId) ?? []), m.body])
    }
    const recurring = [...byEvent.entries()].filter(([id, bodies]) => bodies.length >= 2 && index.event.get(id)?.variants)
    expect(recurring.length).toBeGreaterThan(0)
    for (const [id, bodies] of recurring) {
      expect(bodies[1], id).not.toBe(bodies[0])
    }
  })
})
