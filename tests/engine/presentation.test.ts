import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { collisions, incidentCommand } from '@/store/selectors'
import { testIndex } from './helpers'

describe('incident command view', () => {
  it('shows only what the player has been told', () => {
    const index = testIndex()
    // Find a campaign that actually has an incident to look at.
    let state = newGame(index, { seed: 'cmd-1' })
    let found = false
    for (let seed = 0; seed < 12 && !found; seed += 1) {
      state = newGame(index, { seed: `cmd-${seed}` })
      for (let day = 0; day < 364; day += 1) {
        runDays(state, index, 1)
        if (incidentCommand(state, index)) {
          found = true
          break
        }
      }
    }
    expect(found, 'no campaign produced an incident to inspect').toBe(true)

    const view = incidentCommand(state, index)!
    expect(view.name.length).toBeGreaterThan(3)
    expect(view.daysRunning).toBeGreaterThanOrEqual(0)

    // Every timeline entry must correspond to a message the player was sent:
    // the attack path is hidden truth and may not reach the screen.
    const told = new Set(
      state.inbox.messages.filter((m) => m.type === 'incident').map((m) => m.body || m.subject),
    )
    for (const entry of view.timeline) {
      expect(told.has(entry.text), `timeline entry was never sent to the player: ${entry.text}`).toBe(true)
    }
  })

  it('records the choices taken during the response', () => {
    const index = testIndex()
    for (let seed = 0; seed < 12; seed += 1) {
      const state = newGame(index, { seed: `cmd-take-${seed}` })
      for (let day = 0; day < 364; day += 1) {
        const live = incidentCommand(state, index)
        if (live && live.awaiting.length > 0) {
          const target = live.awaiting[0]!
          const runtime = state.decisions.decisions[target.decisionId]!
          const def = index.decision.get(runtime.defId)!
          applyAction(state, index, {
            type: 'resolveDecision',
            decisionId: target.decisionId,
            optionId: def.options[0]!.id,
            rationaleTagIds: ['rat-within-tolerance'],
          })
          // The field existed and nothing wrote to it, so the record was empty.
          const after = incidentCommand(state, index)
          expect(after?.taken.some((entry) => entry.title === def.title)).toBe(true)
          return
        }
        runDays(state, index, 1)
      }
    }
    throw new Error('no incident offered a decision within twelve campaigns')
  })
})

describe('collisions', () => {
  it('only names a date something could actually have covered', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'collide-1' })
    let sawOne = false
    for (let day = 0; day < 364; day += 1) {
      for (const collision of collisions(state, index)) {
        sawOne = true
        // A collision with no relevant programme is just a date; it is filtered
        // out rather than shown as "nothing covers this" every day.
        expect(collision.verdict).not.toBe('nothing-relevant')
        expect(collision.programmeName, collision.objectiveName).toBeTruthy()
        expect(collision.daysUntilTarget).toBeGreaterThanOrEqual(0)
        // The card offers a way into the decision, so the ids it navigates by
        // have to be real ones.
        expect(index.programme.get(collision.programmeId!), collision.programmeId).toBeDefined()
        for (const risk of collision.exposedRisks) {
          expect(index.riskScenario.get(risk.id), risk.id).toBeDefined()
        }
      }
      runDays(state, index, 1)
    }
    expect(sawOne, 'a year of play produced no collision at all').toBe(true)
  })

  it('reports a started programme differently from one never begun', () => {
    const index = testIndex()
    const idle = newGame(index, { seed: 'collide-2' })
    runDays(idle, index, 60)
    const beforeStart = collisions(idle, index)
    expect(beforeStart.some((collision) => collision.verdict === 'not-started')).toBe(true)

    const working = newGame(index, { seed: 'collide-2' })
    const def = index.programme.get('prog-identity')!
    applyAction(working, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
    runDays(working, index, 60)
    const started = collisions(working, index)
    const identityCollision = started.find((collision) => collision.programmeName === def.name)
    if (identityCollision) expect(identityCollision.verdict).not.toBe('not-started')
  })
})
