import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'

// 19 November: each closed incident gets its own "After the incident"
// reflection, at most two a year. It was once a year, on the latest.
it('asks about each closed incident in turn, and stops at two', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'reflection-each' })
  state.currentDay = 100
  state.events.suppressedEventIds = index.content.events.map((event) => event.id).filter((id) => id !== 'evt-org-post-incident')
  state.threats.actors = {}; state.threats.campaigns = []
  const ids: string[] = []
  for (const familyId of ['fam-data-breach', 'fam-ransomware', 'fam-legacy-outage']) {
    const incident = createIncident(state, index, { familyId })!
    incident.phase = 'closed'; incident.resolvedDay = state.currentDay
    ids.push(incident.id)
  }
  const reflections = () => Object.values(state.decisions.decisions).filter((d) => d.defId === 'dec-post-incident')
  for (let day = 0; day < 120; day += 1) {
    runDays(state, index, 1)
    for (const id of [...state.decisions.openIds]) {
      const runtime = state.decisions.decisions[id]!
      const def = index.decision.get(runtime.defId)!
      for (const option of def.options) {
        if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: [def.rationaleTagIds?.[0] ?? 'rat-more-evidence'] }).ok) break
      }
    }
  }
  const asked = reflections().map((d) => d.incidentId)
  expect(asked.length).toBe(2)
  expect(new Set(asked).size).toBe(2)
  expect(asked.every((id) => ids.includes(id!))).toBe(true)
})
