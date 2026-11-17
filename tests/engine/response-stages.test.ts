import { expect, it } from 'vitest'
import { testIndex } from './helpers'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'

// Owner, 17 November: a ransomware incident's four decisions open in waves,
// each later one with a findings letter, instead of all four at once.
function openIncidentDecisions(state: ReturnType<typeof newGame>) {
  return state.decisions.openIds.map((id) => state.decisions.decisions[id]!).filter((d) => d.incidentId).map((d) => d.defId).sort()
}

it('opens ransomware response in waves, the ransom with what recovery can do', () => {
  const index = testIndex()
  const state = newGame(index, { seed: 'response-stages' })
  state.events.suppressedEventIds = index.content.events.map((event) => event.id)
  state.controls.controls['ctl-backup']!.coverage = 0.3
  const incident = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
  incident.detectionDay = state.currentDay
  let guard = 0
  while (incident.responseStartedDay === undefined && guard++ < 10) runDays(state, index, 1)
  const start = incident.responseStartedDay!
  expect(openIncidentDecisions(state)).toEqual(['dec-inc-command', 'dec-inc-isolate'])
  runDays(state, index, start + 2 - state.currentDay)
  expect(openIncidentDecisions(state)).toContain('dec-inc-external')
  expect(openIncidentDecisions(state)).not.toContain('dec-inc-ransom')
  expect(state.inbox.messages.some((m) => m.subject === 'First findings: how far it reached')).toBe(true)
  runDays(state, index, start + 4 - state.currentDay)
  expect(openIncidentDecisions(state)).toContain('dec-inc-ransom')
  const letter = state.inbox.messages.find((m) => m.subject === 'Encryption confirmed: what recovery can do')!
  expect(letter.body).toContain('Some backups were reachable from the compromised accounts')
  expect(letter.body).not.toContain('The backups sit where')
  expect(incident.stagesOpened).toBe(2)
})

it('keeps a payment recall immediate', () => {
  const index = testIndex()
  const fraud = index.incidentFamily.get('fam-payment-fraud')!
  expect(fraud.responseStages ?? []).toEqual([])
})
