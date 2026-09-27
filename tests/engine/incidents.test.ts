import { describe, expect, it } from 'vitest'
import { newGame, runDays, applyAction } from '@/game/engine/orchestrator'
import { createIncident } from '@/game/incidents/create'
import { buildReconstruction } from '@/game/incidents/engine'
import { testIndex } from './helpers'

describe('incident engine', () => {
  it('runs an incident through every phase to closure', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inc-1' })
    createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom', actorId: 'actor-ransom' })
    const seen = new Set<string>()
    for (let i = 0; i < 200; i += 1) {
      runDays(state, index, 1)
      const incident = Object.values(state.incidents.incidents)[0]!
      seen.add(incident.phase)
      if (incident.phase === 'closed') break
    }
    const incident = Object.values(state.incidents.incidents)[0]!
    expect(incident.phase).toBe('closed')
    expect(seen.has('containment')).toBe(true)
    expect(seen.has('recovery')).toBe(true)
    expect(incident.reconstruction).toBeDefined()
    expect(incident.resolvedDay).toBeDefined()
  })

  it('produces a materially different outcome when the controls were better', () => {
    const index = testIndex()
    const weak = newGame(index, { seed: 'inc-2' })
    const strong = newGame(index, { seed: 'inc-2' })
    for (const controlId of ['ctl-backup', 'ctl-ir', 'ctl-edr', 'ctl-segmentation', 'ctl-soc']) {
      const control = strong.controls.controls[controlId]!
      control.coverage = 0.95
      control.configurationQuality = 0.9
      control.operationalEffectiveness = 0.9
      control.monitoringQuality = 0.9
      control.exceptionRate = 0.05
    }
    createIncident(weak, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })
    createIncident(strong, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })
    const weakIncident = Object.values(weak.incidents.incidents)[0]!
    const strongIncident = Object.values(strong.incidents.incidents)[0]!
    expect(strongIncident.consequence).toBeLessThan(weakIncident.consequence)

    runDays(weak, index, 60)
    runDays(strong, index, 60)
    expect(strongIncident.consequence).toBeLessThan(weakIncident.consequence)
  })

  it('opens executive response decisions rather than technical ones', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inc-3' })
    createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })
    runDays(state, index, 3)
    const openDefIds = state.decisions.openIds.map((id) => state.decisions.decisions[id]?.defId)
    expect(openDefIds).toContain('dec-inc-command')
  })

  it('degrades the health of affected services and recovers afterwards', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inc-4' })
    createIncident(state, index, { familyId: 'fam-legacy-outage', pathId: 'path-phish-legacy' })
    runDays(state, index, 12)
    const ordersNode = index.service.get('svc-orders')!.nodeId
    expect(state.business.serviceHealth[ordersNode]).toBeLessThan(1)
    // Read the recovery before anything else happens to the service: on this
    // seed a separate breach starts on day 129 and hits order management, and
    // a single reading at day 132 measured that instead.
    let recovered = 0
    for (let day = 0; day < 120; day += 1) {
      runDays(state, index, 1)
      const another = Object.values(state.incidents.incidents).some((i) => i.startedDay > 1 && i.affectedServiceIds.includes('svc-orders'))
      if (another) break
      recovered = Math.max(recovered, state.business.serviceHealth[ordersNode]!)
    }
    expect(recovered).toBeGreaterThan(0.9)
  })

  it('reconstructs the path without labelling decisions right or wrong', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inc-5' })
    const incident = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
    const reconstruction = buildReconstruction(state, index, incident)
    expect(reconstruction.pathSummary.length).toBe(index.attackPath.get('path-msp-ransom')!.steps.length)
    expect(reconstruction.narrative).toContain('The route ran')
    const text = JSON.stringify(reconstruction).toLowerCase()
    expect(text).not.toContain('you were wrong')
    expect(text).not.toContain('incorrect decision')
  })

  it('lets executive choices during the incident change containment', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inc-6' })
    createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })
    runDays(state, index, 3)
    const decisionId = state.decisions.openIds.find(
      (id) => state.decisions.decisions[id]?.defId === 'dec-inc-isolate',
    )
    expect(decisionId, 'the isolate decision should be open during containment').toBeDefined()
    if (!decisionId) return
    const incident = Object.values(state.incidents.incidents)[0]!
    const before = incident.containment
    applyAction(state, index, {
      type: 'resolveDecision',
      decisionId,
      optionId: 'opt-inc-isolate-yes',
      rationaleTagIds: [],
    })
    expect(incident.containment).toBeGreaterThan(before)
  })
})
