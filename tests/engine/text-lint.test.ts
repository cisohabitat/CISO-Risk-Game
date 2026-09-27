import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview } from '@/game/debrief/review'
import { renderDecisionText } from '@/game/decisions/describe'
import type { Difficulty } from '@/game/types'
import { testIndex } from './helpers'

/**
 * Everything a year says, read by a machine for the mistakes a reader
 * notices first. Run over 72 campaigns across every mode and situation it
 * found "0 of 1 programmes", one evidence line starting in lower case, and
 * nothing unrendered; this keeps a smaller sample of that honest.
 */
const index = testIndex()

const SMELLS: [string, RegExp][] = [
  ['an unrendered token', /\{\{|\}\}/],
  ['a leaked value', /\bundefined\b|\bNaN\b|\[object/],
  ['a doubled space', / {2}/],
  ['a space before punctuation', / [,.;:!?](?!\d)/],
  ['doubled punctuation', /[,;:]{2}|\.\s*\.(?!\.)/],
  ['a plural after one', /\b1 (programmes|decisions|incidents|risks|controls|exercises|times|days|quarters|attacks|objectives|vacancies)\b/],
  ['nothing counted as something', /\b0 of 0\b/],
]

function sayings(seed: string, difficulty: Difficulty, situation: string): string[] {
  const state = newGame(index, { seed, difficulty, situation })
  const said: string[] = []
  for (let day = 0; day < 364; day += 1) {
    for (const id of [...state.decisions.openIds]) {
      const def = index.decision.get(state.decisions.decisions[id]!.defId)!
      said.push(renderDecisionText(def.title, state, index), renderDecisionText(def.description, state, index))
      applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: def.options[day % def.options.length]!.id, rationaleTagIds: (def.rationaleTagIds ?? []).slice(0, 1) })
    }
    if (day === 20) {
      const def = index.programme.get('prog-identity')!
      applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
    }
    runDays(state, index, 1)
  }
  for (const m of state.inbox.messages) said.push(m.subject, m.body)
  const review = buildAnnualReview(state, index)
  said.push(...review.narrative, ...review.blindSpots)
  for (const d of review.dimensions) {
    said.push(d.narrative, ...d.evidence)
    for (const line of d.evidence) expect(line, `evidence starts in lower case: ${line}`).toMatch(/^[A-Z0-9"£]/)
  }
  return said
}

describe('what a year says', () => {
  it('has none of the mistakes a reader notices first', () => {
    const cases: [string, Difficulty, string][] = [
      ['lint-a', 'guided', 'sit-new-money'],
      ['lint-b', 'ciso', 'sit-after-breach'],
      ['lint-c', 'high-pressure', 'sit-tidy'],
      ['lint-d', 'ciso', 'sit-inherited-mess'],
    ]
    for (const [seed, difficulty, situation] of cases) {
      for (const text of sayings(seed, difficulty, situation)) {
        for (const [smell, pattern] of SMELLS) expect(text, `${seed}: ${smell}`).not.toMatch(pattern)
      }
    }
  })
})
