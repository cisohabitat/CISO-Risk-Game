import { describe, expect, it } from 'vitest'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { responseCapability } from '@/game/controls/effectiveness'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * Once an attack is seen, pushing it out depends on the organisation's
 * response capability. It used to depend on how hard the attacked step was to
 * pass, so a better SOC changed almost nothing: evictions went from 0.06 to
 * 0.08 a year with the detection programme finished.
 */
const index = testIndex()
const RESPONDERS = ['ctl-soc', 'ctl-edr', 'ctl-ir']

function arrange(seed: string, capable: boolean): GameState {
  const state = newGame(index, { seed })
  for (const id of RESPONDERS) {
    const control = state.controls.controls[id]!
    const value = capable ? 1 : 0
    control.coverage = value
    control.configurationQuality = value
    control.operationalEffectiveness = value
    control.monitoringQuality = value
    control.exceptionRate = capable ? 0 : 1
  }
  // Both arrangements see equally well, so they differ only in acting on it.
  const logging = state.controls.controls['ctl-logging']!
  logging.coverage = 1
  logging.monitoringQuality = 1
  const path = index.attackPath.get('path-portal-credential')!
  state.threats.campaigns.push({
    id: 'camp-seen', actorId: Object.keys(path.actorAffinity)[0]!, pathId: path.id, stage: 'interest', stepIndex: 0,
    stepProgress: 0, startedDay: 0, lastAdvanceDay: 0, detected: true, disrupted: false, evidenceRaisedIds: [],
  })
  return state
}

const evicted = (state: GameState) => {
  const campaign = state.threats.campaigns.find((c) => c.id === 'camp-seen')!
  return campaign.disrupted && !campaign.heldAt
}

describe('responding to what the SOC sees', () => {
  it('reads response capability from the response controls', () => {
    const strong = arrange('cap-1', true)
    const none = arrange('cap-2', false)
    const all = (state: GameState) => index.content.controls.map((def) => ({ def, runtime: state.controls.controls[def.id]! }))
    expect(responseCapability(all(strong))).toBeGreaterThan(0.7)
    expect(responseCapability(all(none))).toBe(0)
  })

  it('pushes out far more of the attacks it sees when the SOC can act', () => {
    const seeds = Array.from({ length: 16 }, (_, i) => `evict-${i}`)
    const run = (capable: boolean) =>
      seeds.filter((seed) => {
        const state = arrange(seed, capable)
        // Under 70 days, so no actor has gone stale: every ending is a hold
        // or an eviction.
        runDays(state, index, 60)
        return evicted(state)
      }).length
    const capable = run(true)
    const absent = run(false)
    // A lapsed decision's default can set an actor back too (a threat hunt),
    // which ends the odd campaign whatever the SOC can do.
    expect(absent, 'an absent SOC pushed attackers out').toBeLessThanOrEqual(1)
    expect(capable, 'a capable SOC rarely acted on what it saw').toBeGreaterThanOrEqual(8)
  })
})
