import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * Two programme messages used to fire on "any programme active" and claim a
 * state nobody checked. Measured over 20 campaigns: "A programme has stalled"
 * was true in 27 of 93 arrivals, "A programme is ahead of plan" in 0 of 54 — and could not be, so it now says "on plan".
 * "On plan" then meant within two points of the nominal rate, which a clean
 * programme holding 92% of that rate leaves behind within about two months, so
 * the message went unsendable in any campaign that built early. It is a tenth
 * of plan now, and the event opens on day 60 rather than 120.
 * A message that claims a state has to test for it.
 */
const PROGRAMMES = ['prog-identity', 'prog-ransomware', 'prog-thirdparty', 'prog-detection']

function buildOneAtATime(state: GameState, index: ReturnType<typeof testIndex>, wanted: { n: number }): void {
  if (wanted.n >= PROGRAMMES.length || state.currentDay <= 20) return
  const live = Object.values(state.programmes.programmes).filter((p) => p.status === 'active')
  if (live.length === 0 || (live.length === 1 && live[0]!.progress > 0.55)) {
    const pid = PROGRAMMES[wanted.n]!
    if (applyAction(state, index, { type: 'startProgramme', programmeId: pid, budget: index.programme.get(pid)!.budgetCost }).ok) wanted.n += 1
  }
}

describe('programme messages claim only what is true', () => {
  it('"stalled" arrives only with a live blocker, and "on plan" only when one is', () => {
    const index = testIndex()
    let stalled = 0, ahead = 0
    for (const seed of ['pm-1', 'pm-2', 'pm-3', 'pm-4', 'pm-5', 'pm-6', 'pm-7', 'pm-8']) {
      const state = newGame(index, { seed })
      const wanted = { n: 0 }
      const seen = new Set<string>()
      for (let day = 0; day < 364; day += 1) {
        runDays(state, index, 1)
        for (const id of [...state.decisions.openIds]) {
          const def = index.decision.get(state.decisions.decisions[id]!.defId)!
          for (const o of def.options) {
            if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: o.id, rationaleTagIds: ['rat-more-evidence'] }).ok) break
          }
        }
        buildOneAtATime(state, index, wanted)
        const live = Object.values(state.programmes.programmes).filter((p) => p.status === 'active' || p.status === 'at-risk')
        for (const message of state.inbox.messages) {
          if (seen.has(message.id)) continue
          seen.add(message.id)
          if (message.subject === 'A programme has stalled') {
            stalled += 1
            expect(live.some((p) => p.blockers.some((b) => !b.resolved)), `${seed} day ${state.currentDay}: stalled with no blocker`).toBe(true)
            // A reminder, not a second announcement: it waits until a blocker has held for a week.
            expect(
              live.some((p) => p.blockers.some((b) => !b.resolved && state.currentDay - b.startedDay >= 7)),
              `${seed} day ${state.currentDay}: stalled on the day the blocker arrived`,
            ).toBe(true)
          }
          if (message.subject === 'A programme is on plan') {
            ahead += 1
            // The event saw the state at its step of the tick; the check runs
            // at the end of the day, after progression moved by up to a day's
            // worth (about 0.005). One day of slack keeps the claim honest
            // without failing on the boundary.
            const onPlan = live.some((p) => {
              const def = index.programme.get(p.id)!
              // A blocker that appeared later the same day is not one the event lied about.
              return p.startedDay !== undefined && state.currentDay - p.startedDay >= 30
                && (p.status === 'active' || p.status === 'at-risk' || p.status === 'paused')
                && p.blockers.every((b) => b.resolved || b.startedDay === state.currentDay)
                // Within a tenth of plan, matching the condition: an absolute
                // two points is narrower than the rate a clean programme can
                // actually hold, which is what made the message unsendable.
                && p.progress >= ((state.currentDay - p.startedDay) / def.durationDays) * 0.9 - 1 / def.durationDays
            })
            expect(onPlan, `${seed} day ${state.currentDay}: "on plan" with nothing on plan`).toBe(true)
          }
        }
      }
    }
    // Both must still be reachable, or the fix has silenced them rather than made them honest.
    expect(stalled, '"A programme has stalled" never arrived in eight building campaigns').toBeGreaterThan(0)
    expect(ahead, '"A programme is on plan" never arrived in eight building campaigns').toBeGreaterThan(0)
  })
})

describe('a programme that finishes', () => {
  it('says so in the inbox, naming what it strengthened', () => {
    // Enquiries announced themselves; a finished programme had only a toast
    // about its last milestone.
    const index = testIndex()
    const state = newGame(index, { seed: 'delivered' })
    runDays(state, index, 3)
    const def = index.programme.get('prog-identity')!
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok).toBe(true)
    let notice
    for (let day = 0; day < 364 && !notice; day += 1) {
      const runtime = state.programmes.programmes[def.id]!
      for (const blocker of runtime.blockers) blocker.resolved = true
      runtime.progress = Math.max(runtime.progress, 0.9)
      runDays(state, index, 1)
      notice = state.inbox.messages.find((m) => m.subject === `Delivered: ${def.name}`)
    }
    expect(notice, 'the identity programme finished in silence').toBeDefined()
    expect(state.programmes.programmes[def.id]!.status).toBe('complete')
    expect(notice!.body).toContain('multi-factor authentication')
    expect(notice!.body).toContain('privileged access management')
    expect(state.inbox.messages.filter((m) => m.subject === `Delivered: ${def.name}`)).toHaveLength(1)
  })
})
