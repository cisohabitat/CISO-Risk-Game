import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { buildQuarterReview, materialTopics } from '@/game/debrief/review'
import { openDecision } from '@/game/decisions/open'
import { openDecisions } from '@/store/selectors'
import { testIndex } from './helpers'

/**
 * From the third observed playthrough (docs/playtests/2026-09-21-ai-fresh-seed.md):
 * the reconstruction blamed data retention on a player who had enforced the
 * policy, the board said "one material item" without naming it, and the
 * unseen-risk decision did not say which risk.
 */
describe('what the third playthrough found', () => {
  it('does not blame retention on a player who enforced the policy', () => {
    const index = testIndex()
    const family = index.content.incidentFamilies.find((f) => f.id === 'fam-data-breach')!
    const run = (enforce: boolean) => {
      const state = newGame(index, { seed: 'pt3-retention' })
      runDays(state, index, 5)
      if (enforce) {
        const runtime = openDecision(state, index, 'dec-data-retention')!
        const taken = applyAction(state, index, { type: 'resolveDecision', decisionId: runtime.id, optionId: 'opt-retention-delete', rationaleTagIds: ['rat-regulatory'] })
        expect(taken.ok, taken.message).toBe(true)
      }
      applyEffects(state, [{ type: 'incident.start', familyId: family.id }], { index, rng: createRng(state.seed, 5), source: 'test' })
      for (let i = 0; i < 120; i += 1) {
        runDays(state, index, 1)
        for (const id of [...state.decisions.openIds]) {
          const def = index.decision.get(state.decisions.decisions[id]!.defId)!
          for (const o of def.options) {
            if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: o.id, rationaleTagIds: [def.rationaleTagIds?.[0] ?? 'rat-more-evidence'] }).ok) break
          }
        }
        const incident = Object.values(state.incidents.incidents)[0]!
        if (incident.phase === 'closed') return incident.reconstruction!.hurt
      }
      throw new Error('the incident never closed')
    }
    expect(run(false)).toContain('Data held longer than the retention policy allowed')
    expect(run(true)).not.toContain('Data held longer than the retention policy allowed')
  })

  it('names the material item the board did not hear about', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt3-board' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-supplier-ransomware' })
    runDays(state, index, 91)
    state.risks.scenarios['risk-supplier-ransomware']!.lastAssessed = { day: state.currentDay, exposure: 0.8, consequence: 0.8, residual: 0.8 }
    const material = materialTopics(state, index).filter((t) => t.material)
    expect(material.length).toBeGreaterThan(0)
    const review = buildQuarterReview(state, index, { quarter: 1, topics: [], recommendations: [], communicateUncertainty: false })
    for (const topic of material) expect(review.boardReaction).toContain(topic.label)
  })

  it('names the risk the board has not seen', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pt3-unseen' })
    runDays(state, index, 3)
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-recovery-failure' })
    openDecision(state, index, 'dec-board-material-risk')
    const view = openDecisions(state, index).find((d) => d.defId === 'dec-board-material-risk')!
    expect(view.description).toContain('Recovery fails when it is needed')
    expect(view.description).not.toContain('{{')
  })
})
