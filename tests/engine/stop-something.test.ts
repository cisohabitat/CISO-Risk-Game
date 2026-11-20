import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { decisionReactions } from '@/store/decision-reactions'

// 4653160 playtest, run 14: "Stop something" paused a programme and the
// receipt did not say so.
it('names the programme a choice paused in its receipt', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'stop-something' })
  expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-ransomware', budget: index.programme.get('prog-ransomware')!.budgetCost }).ok).toBe(true)
  for (const fn of Object.values(state.team.functions)) fn.capacity = 0.1
  const id = openDecision(state, index, 'dec-team-overload')!.id
  const before = structuredClone(state)
  const def = index.decision.get('dec-team-overload')!
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: 'opt-overload-stop', rationaleTagIds: [def.rationaleTagIds?.[0] ?? 'rat-resources'] }).ok).toBe(true)
  const paused = Object.values(state.programmes.programmes).find((p) => p.status === 'paused')
  expect(paused).toBeDefined()
  expect(decisionReactions(before, state, index).some((r) => r.text.includes('paused. Resume it from Programmes'))).toBe(true)
})
