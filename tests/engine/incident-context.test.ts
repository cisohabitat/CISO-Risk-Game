import { describe, expect, it } from 'vitest'
import { testIndex } from './helpers'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { openDecision } from '@/game/decisions/open'
import { pushMessage } from '@/game/inbox/messages'
import { renderDecisionText } from '@/game/decisions/describe'
import { incidentCommand } from '@/store/selectors'

describe('incident correspondence identity', () => {
  it('keeps an earlier incident review separate during a newer response, including after reload', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'incident-context' })
    state.currentDay = 180
    const earlier = createIncident(state, index, { familyId: 'fam-service-tampering' })!
    earlier.phase = 'closed'; earlier.resolvedDay = 179
    const current = createIncident(state, index, { familyId: 'fam-data-breach' })!
    current.phase = 'containment'
    pushMessage(state, { from: 'Incident response', subject: 'Containment', body: 'Containment is continuing.', type: 'incident', incidentId: current.id })
    pushMessage(state, { from: 'Archive', subject: 'Legacy message', body: 'An unlinked incident is closed.', type: 'incident' })
    pushMessage(state, { from: 'Incident response', subject: 'Progress', body: 'A later update on the same day.', type: 'incident', incidentId: current.id })
    state.events.scheduled.push({ eventId: 'evt-org-post-incident', day: 181 })
    runDays(state, index, 1)
    const review = Object.values(state.decisions.decisions).find((decision) => decision.defId === 'dec-post-incident')!
    expect(review.incidentId).toBe(earlier.id)
    const message = state.inbox.messages.find((entry) => entry.eventId === 'evt-org-post-incident')!
    expect(message.incidentId).toBe(earlier.id)
    expect(message.body).toContain('Customer platform tampering')
    expect(renderDecisionText(index.decision.get(review.defId)!.description, state, index, review)).toContain('Customer platform tampering')
    expect(applyAction(state, index, { type: 'resolveDecision', decisionId: review.id, optionId: 'opt-post-honest', rationaleTagIds: [] }).ok).toBe(true)
    expect(current.decisionsTaken).toHaveLength(0)
    const view = incidentCommand(JSON.parse(JSON.stringify(state)), index)!
    expect(view.name).toBe('Customer data exposure')
    expect(view.phase).toBe('containment')
    expect(view.timeline.map((entry) => entry.text)).toEqual(['Containment is continuing.', 'A later update on the same day.'])
  })

  it('scopes response decisions, duplicate prevention and effects to their recorded incident', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'incident-response-context' })
    const first = createIncident(state, index, { familyId: 'fam-service-tampering' })!
    const second = createIncident(state, index, { familyId: 'fam-data-breach' })!
    const command = openDecision(state, index, 'dec-inc-command', { incidentId: first.id })!
    const other = openDecision(state, index, 'dec-inc-command', { incidentId: second.id })!
    expect(other.id).not.toBe(command.id)
    expect(openDecision(state, index, 'dec-inc-command', { incidentId: first.id })!.id).toBe(command.id)
    expect(incidentCommand(state, index)!.awaiting.map((entry) => entry.decisionId)).toEqual([command.id])
    expect(applyAction(state, index, { type: 'resolveDecision', decisionId: command.id, optionId: 'opt-inc-command-yes', rationaleTagIds: [] }).ok).toBe(true)
    expect(first.commandActivated).toBe(true)
    expect(second.commandActivated).toBe(false)
    expect(first.decisionsTaken.map((entry) => entry.decisionId)).toEqual([command.id])
    expect(second.decisionsTaken).toHaveLength(0)
  })
})
