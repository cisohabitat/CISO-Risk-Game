import { describe, expect, it } from 'vitest'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview } from '@/game/debrief/review'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * A step that holds is abandoned. Before, an actor kept trying a step until it
 * passed and gave up only after 70+ days without progress, so a stronger
 * control delayed a breach and almost never prevented one: on the supplier
 * routes 70% of campaigns became incidents whether or not the supplier
 * programme had halved the entry step's pass chance.
 */
const index = testIndex()
const PATH = 'path-logistics-supplier'

function arrange(seed: string, strength: number): GameState {
  const state = newGame(index, { seed })
  const control = state.controls.controls['ctl-3p-access']!
  control.coverage = strength
  control.configurationQuality = strength
  control.operationalEffectiveness = strength
  control.exceptionRate = strength > 0 ? 0 : 1
  const path = index.attackPath.get(PATH)!
  const actorId = Object.keys(path.actorAffinity)[0]!
  state.threats.campaigns.push({
    id: 'camp-arranged', actorId, pathId: PATH, stage: 'interest', stepIndex: 0, stepProgress: 0,
    startedDay: 0, lastAdvanceDay: 0, detected: true, disrupted: false, evidenceRaisedIds: [],
  })
  return state
}

const heldAtEntry = (state: GameState) => state.threats.campaigns.find((c) => c.id === 'camp-arranged')?.heldAt === 'node-sup-logistics'

describe('a step that holds', () => {
  it('turns an attacker back at a strong control, and rarely at a weak one', () => {
    const seeds = Array.from({ length: 10 }, (_, i) => `hold-${i}`)
    const strong = seeds.filter((seed) => {
      const state = arrange(seed, 1)
      runDays(state, index, 120)
      return heldAtEntry(state)
    }).length
    const weak = seeds.filter((seed) => {
      const state = arrange(seed, 0)
      runDays(state, index, 120)
      return heldAtEntry(state)
    }).length
    expect(strong, 'a strong control rarely held').toBeGreaterThanOrEqual(7)
    expect(weak, 'a control that is not there held').toBeLessThanOrEqual(1)
  })

  it('is reported by the SOC when it had seen the attempt, and named only once mapped', () => {
    let reported = 0
    for (const seed of ['told-1', 'told-2', 'told-3', 'told-4', 'told-5']) {
      const state = arrange(seed, 1)
      runDays(state, index, 120)
      if (!heldAtEntry(state)) continue
      const gaveUp = state.threats.campaigns.find((c) => c.id === 'camp-arranged')!.disruptedDay
      const message = state.inbox.messages.find((m) => m.subject === 'The attempt did not get through' && m.day === gaveUp)
      expect(message, 'a hold the SOC had seen went unreported').toBeDefined()
      const name = index.node.get('node-sup-logistics')!.name
      const mapped = state.organisation.nodes['node-sup-logistics']!.discovered
      // Discovery only grows, so a system unmapped now was unmapped then.
      if (!mapped) expect(message!.body).not.toContain(name)
      expect(message!.body.includes(name) || message!.body.includes('an internal system')).toBe(true)
      reported += 1
    }
    expect(reported).toBeGreaterThan(0)
  })

  it('shows at the close, naming only the places the player has mapped', () => {
    const state = newGame(index, { seed: 'held-close' })
    const base = { stage: 'interest' as const, stepIndex: 0, stepProgress: 0, startedDay: 10, lastAdvanceDay: 10, detected: false, disrupted: true, evidenceRaisedIds: [] }
    state.threats.campaigns.push({ ...base, id: 'c1', actorId: 'x', pathId: PATH, heldAt: 'node-sup-logistics' })
    state.threats.campaigns.push({ ...base, id: 'c2', actorId: 'x', pathId: 'path-ci-supply', heldAt: 'node-ci-pipeline' })
    state.organisation.nodes['node-sup-logistics']!.discovered = true
    state.organisation.nodes['node-ci-pipeline']!.discovered = false
    const evidence = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'resilience')!.evidence
    const line = evidence.find((e) => e.includes('gave up at a control that held'))
    expect(line).toBe(`2 attacks gave up at a control that held, at ${index.node.get('node-sup-logistics')!.name} and one place you had not mapped`)
    expect(line).not.toContain(index.node.get('node-ci-pipeline')!.name)
  })
})
