import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview } from '@/game/debrief/review'
import { openDecisions } from '@/store/selectors'
import { testIndex } from './helpers'
import type { GameState } from '@/game/types'

/**
 * The fourth quarter used to be decided by the draw alone: 1.4 decisions in
 * Q4 against 12.4 in Q1, all of them incidents. These arise from the
 * player's own position — a programme they nearly finished, an acceptance
 * they gave, a launch they supported, a year that stayed quiet.
 */
function answerEverything(state: GameState, index: ReturnType<typeof testIndex>, except?: string): string[] {
  const opened: string[] = []
  for (const id of [...state.decisions.openIds]) {
    const runtime = state.decisions.decisions[id]!
    const def = index.decision.get(runtime.defId)!
    opened.push(def.id)
    if (def.id === except) continue
    for (const option of def.options) {
      const reason = def.rationaleTagIds?.[0] ?? 'rat-more-evidence'
      if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: [reason] }).ok) break
    }
  }
  return opened
}

describe('an acceptance that runs out', () => {
  it('opens a renewal decision about that scenario, and the options act on it', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'q4-renew' })
    runDays(state, index, 5)
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-supplier-ransomware' })
    const accepted = applyAction(state, index, {
      type: 'acceptRisk', scenarioId: 'risk-supplier-ransomware', rationaleTagIds: ['rat-within-tolerance'],
      assumptionDefIds: [], days: 30,
    })
    expect(accepted.ok, accepted.message).toBe(true)

    let renewal: { id: string; description: string } | undefined
    for (let day = 0; day < 40 && !renewal; day += 1) {
      runDays(state, index, 1)
      renewal = openDecisions(state, index).find((d) => d.defId === 'dec-acceptance-renewal')
      if (!renewal) answerEverything(state, index)
    }
    expect(renewal, 'the acceptance ran out and no renewal decision opened').toBeDefined()
    expect(renewal!.description).toContain('Supplier-enabled ransomware across production')
    expect(renewal!.description).not.toContain('{{')
    expect(state.risks.scenarios['risk-supplier-ransomware']!.status).toBe('open')
    expect(state.inbox.messages.some((m) => m.subject.startsWith('Your acceptance of'))).toBe(true)

    const renewed = applyAction(state, index, {
      type: 'resolveDecision', decisionId: renewal!.id, optionId: 'opt-renewal-renew', rationaleTagIds: ['rat-within-tolerance'],
    })
    expect(renewed.ok, renewed.message).toBe(true)
    const scenario = state.risks.scenarios['risk-supplier-ransomware']!
    expect(scenario.status).toBe('accepted')
    expect(scenario.acceptedUntilDay).toBe(state.currentDay + 90)
  })
})

describe('the fourth quarter arises from the player\'s position', () => {
  it('asks about enforcing identity only when the player nearly finished the programme', () => {
    const index = testIndex()
    const built = newGame(index, { seed: 'q4-identity' })
    runDays(built, index, 3)
    const start = applyAction(built, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: index.programme.get('prog-identity')!.budgetCost })
    expect(start.ok, start.message).toBe(true)
    const idle = newGame(index, { seed: 'q4-identity' })
    let askedBuilt = false, askedIdle = false
    for (let day = 0; day < 364; day += 1) {
      runDays(built, index, 1); runDays(idle, index, 1)
      if (answerEverything(built, index).includes('dec-q4-identity-enforce')) askedBuilt = true
      if (answerEverything(idle, index).includes('dec-q4-identity-enforce')) askedIdle = true
    }
    expect(askedBuilt, 'the programme reached 80% and nobody asked about enforcement').toBe(true)
    expect(askedIdle, 'asked about enforcing a programme that was never started').toBe(false)
  })

  it('asks about next year\'s budget only after a quiet year, and the review says what was answered', () => {
    const index = testIndex()
    let quiet: GameState | undefined, loud: GameState | undefined
    for (let s = 0; s < 30 && !(quiet && loud); s += 1) {
      const state = newGame(index, { seed: `q4-budget-${s}`, difficulty: 'guided' })
      let asked = false
      for (let day = 0; day < 364; day += 1) {
        runDays(state, index, 1)
        const opened = answerEverything(state, index, 'dec-q4-next-year-budget')
        if (opened.includes('dec-q4-next-year-budget')) {
          asked = true
          const id = state.decisions.openIds.find((d) => state.decisions.decisions[d]!.defId === 'dec-q4-next-year-budget')!
          applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: 'opt-q4-budget-hold', rationaleTagIds: ['rat-material'] })
        }
      }
      const incidents = Object.keys(state.incidents.incidents).length
      if (incidents === 0) { expect(asked, `${state.seed}: a quiet year and finance never asked`).toBe(true); quiet ??= state }
      else { expect(asked, `${state.seed}: ${incidents} incident(s) and finance called it quiet`).toBe(false); loud ??= state }
    }
    expect(quiet, 'no quiet year in 30 seeds').toBeDefined()
    expect(loud, 'no year with an incident in 30 seeds').toBeDefined()
    const review = buildAnnualReview(quiet!, index)
    expect(review.narrative.join(' ')).toContain('kept the line')
  })

  /**
   * The restore-window decision, and the two consequence callbacks behind its
   * options, are the deepest chain in the content: a programme funded early,
   * carried to four fifths, and still standing in the fourth quarter. A
   * coverage run that builds in content order never reaches it, and the
   * report reads it as dead content. It is not, and this says so.
   */
  it('offers the restore window to a player who funded recovery and saw it through', () => {
    const index = testIndex()
    const def = index.programme.get('prog-ransomware')!
    const state = newGame(index, { seed: 'q4-recovery', difficulty: 'ciso' })
    runDays(state, index, 5)
    expect(applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok).toBe(true)

    let openedOnDay: number | undefined
    for (let day = 0; day < 340 && openedOnDay === undefined; day += 1) {
      runDays(state, index, 1)
      const programme = state.programmes.programmes[def.id]!
      // A blocker is something the player is shown and can clear.
      for (const blocker of programme.blockers) {
        if (!blocker.resolved) {
          applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: def.id, blockerId: blocker.id })
        }
      }
      if (openDecisions(state, index).some((decision) => decision.defId === 'dec-q4-recovery-window')) {
        openedOnDay = state.currentDay
      }
    }
    expect(openedOnDay, 'the restore window never came to a player who built recovery').toBeDefined()
    expect(openedOnDay!).toBeGreaterThan(270)
    // And the programme it rests on actually finished, which is the other
    // thing a probe that never cleared a blocker made look impossible.
    expect(state.programmes.programmes[def.id]!.status).toBe('complete')
  })
})
