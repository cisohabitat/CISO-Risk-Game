import { describe, expect, it } from 'vitest'
import { newGame } from '@/game/engine/orchestrator'
import {
  assessPathSteps,
  assessScenario,
  calculateConsequence,
  calculatePathViability,
  calculateRecoveryModifier,
  calculateThreatPressure,
  calculateUncertainty,
} from '@/game/risk/calculations'
import { applyDrift, calculateControlEffectiveness, resistanceToTechnique } from '@/game/controls/effectiveness'
import { riskBand, confidenceFromUncertainty, describeChange } from '@/game/risk/bands'
import { testIndex } from './helpers'

describe('risk calculations', () => {
  it('reduces path viability as the controls on it improve', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'risk-1' })
    const path = index.attackPath.get('path-msp-ransom')!
    const before = calculatePathViability(state, index, path)
    for (const controlId of ['ctl-mfa', 'ctl-pam', 'ctl-3p-access', 'ctl-segmentation']) {
      const control = state.controls.controls[controlId]!
      control.coverage = 0.95
      control.configurationQuality = 0.9
      control.operationalEffectiveness = 0.9
      control.exceptionRate = 0.05
    }
    const after = calculatePathViability(state, index, path)
    expect(after).toBeLessThan(before)
  })

  it('treats a path through a node that does not exist as unviable', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'risk-2' })
    const path = index.attackPath.get('path-checkout-data')!
    state.organisation.nodes[path.steps[0]!.nodeId]!.exists = false
    expect(calculatePathViability(state, index, path)).toBe(0)
  })

  it('rates a critical, low-tolerance service above a tolerant one', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'risk-3' })
    const payments = calculateConsequence(state, index, ['svc-payments'], 0.8)
    const corporate = calculateConsequence(state, index, ['svc-corporate'], 0.8)
    expect(payments).toBeGreaterThan(corporate)
  })

  it('lets recovery capability blunt consequence without removing it', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'risk-4' })
    const weak = calculateRecoveryModifier(state, index)
    const backup = state.controls.controls['ctl-backup']!
    backup.coverage = 1
    backup.operationalEffectiveness = 1
    backup.configurationQuality = 1
    const strong = calculateRecoveryModifier(state, index)
    expect(strong).toBeLessThan(weak)
    expect(strong).toBeGreaterThan(0.2)
  })

  it('raises threat pressure with actor interest and sector pressure', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'risk-5' })
    const actor = state.threats.actors['actor-ransom']!
    actor.interest = 0.1
    actor.activityLevel = 0.1
    state.threats.sectorPressure = 0.1
    const low = calculateThreatPressure(state, index, 'actor-ransom')
    actor.interest = 0.9
    actor.activityLevel = 0.9
    state.threats.sectorPressure = 0.9
    expect(calculateThreatPressure(state, index, 'actor-ransom')).toBeGreaterThan(low)
  })

  it('narrows uncertainty as the world is discovered and assured', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'risk-6' })
    const def = index.riskScenario.get('risk-supplier-ransomware')!
    const before = calculateUncertainty(state, index, def)
    for (const node of Object.values(state.organisation.nodes)) {
      node.discovered = true
      node.discoveryConfidence = 1
    }
    for (const control of Object.values(state.controls.controls)) {
      control.believed = {
        coverage: control.coverage,
        configurationQuality: control.configurationQuality,
        operationalEffectiveness: control.operationalEffectiveness,
        monitoringQuality: control.monitoringQuality,
        exceptionRate: control.exceptionRate,
        assessedOnDay: state.currentDay,
      }
    }
    expect(calculateUncertainty(state, index, def)).toBeLessThan(before)
  })

  it('assesses every authored scenario without producing invalid numbers', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'risk-7' })
    for (const def of index.content.riskScenarios) {
      const assessment = assessScenario(state, index, def)
      for (const value of [assessment.exposure, assessment.consequence, assessment.residual, assessment.uncertainty]) {
        expect(Number.isFinite(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })

  it('never exposes a raw number through the band vocabulary', () => {
    expect(riskBand(0)).toBe('low')
    expect(riskBand(0.45)).toBe('elevated')
    expect(riskBand(0.99)).toBe('severe')
    expect(confidenceFromUncertainty(0.1)).toBe('strong')
    expect(confidenceFromUncertainty(0.9)).toBe('limited')
    expect(describeChange(undefined, 0.5)).toBe('newly assessed')
    expect(describeChange(0.2, 0.5)).toBe('materially worse')
    expect(describeChange(0.5, 0.2)).toBe('materially improved')
  })
})

describe('control effectiveness', () => {
  it('treats partial coverage as a partial control', () => {
    const full = calculateControlEffectiveness({
      id: 'x', coverage: 1, configurationQuality: 0.9, operationalEffectiveness: 0.9, monitoringQuality: 0.5, exceptionRate: 0, believed: null,
    })
    const half = calculateControlEffectiveness({
      id: 'x', coverage: 0.5, configurationQuality: 0.9, operationalEffectiveness: 0.9, monitoringQuality: 0.5, exceptionRate: 0, believed: null,
    })
    expect(half).toBeLessThan(full * 0.6)
  })

  it('penalises a large standing exception population', () => {
    const base = { id: 'x', coverage: 0.9, configurationQuality: 0.8, operationalEffectiveness: 0.8, monitoringQuality: 0.5, believed: null }
    const clean = calculateControlEffectiveness({ ...base, exceptionRate: 0 })
    const excepted = calculateControlEffectiveness({ ...base, exceptionRate: 0.6 })
    expect(excepted).toBeLessThan(clean)
  })

  it('composes defence in depth with diminishing returns', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'controls-1' })
    const mfa = index.control.get('ctl-mfa')!
    const pam = index.control.get('ctl-pam')!
    const runtime = { id: 'x', coverage: 0.8, configurationQuality: 0.8, operationalEffectiveness: 0.8, monitoringQuality: 0.6, exceptionRate: 0.1, believed: null }
    const one = resistanceToTechnique('supplier-remote-access', [{ runtime, def: mfa }])
    const two = resistanceToTechnique('supplier-remote-access', [
      { runtime, def: mfa },
      { runtime, def: pam },
    ])
    expect(two).toBeGreaterThan(one)
    expect(two - one).toBeLessThan(one)
    expect(state.currentDay).toBe(1)
  })

  it('assesses steps consistently along an authored path', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'controls-2' })
    const path = index.attackPath.get('path-phish-legacy')!
    const steps = assessPathSteps(state, index, path)
    expect(steps).toHaveLength(path.steps.length)
    for (const step of steps) {
      expect(step.passChance).toBeGreaterThanOrEqual(0)
      expect(step.passChance).toBeLessThanOrEqual(1)
      expect(step.detectionChance).toBeGreaterThanOrEqual(0)
      expect(step.detectionChance).toBeLessThanOrEqual(1)
    }
  })
})

describe('control drift', () => {
  it('settles at a floor rather than decaying toward nothing', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'drift-floor' })
    const before = structuredClone(state.controls.controls)
    // Two full years of pure drift, far longer than a campaign, isolated from
    // everything else a tick would do.
    for (let i = 0; i < 726; i += 1) {
      for (const def of index.content.controls) {
        applyDrift(state.controls.controls[def.id]!, def, false)
      }
    }

    for (const def of index.content.controls) {
      const now = state.controls.controls[def.id]!
      const then = before[def.id]!
      // Nothing collapses to nothing: capability built mostly persists.
      if (def.driftKind === 'coverage-erosion') {
        expect(now.coverage, def.id).toBeGreaterThanOrEqual(then.coverage * def.driftFloor - 1e-6)
      } else if (def.driftKind === 'operational-decay') {
        expect(now.operationalEffectiveness, def.id).toBeGreaterThanOrEqual(
          then.operationalEffectiveness * def.driftFloor - 1e-6,
        )
      } else {
        expect(now.exceptionRate, def.id).toBeLessThanOrEqual(0.85 + 1e-6)
      }
    }
  })

  it('raises the floor when a programme raises the control', () => {
    // Capability that has been built should not decay back to where it started.
    const index = testIndex()
    const state = newGame(index, { seed: 'drift-peak' })
    const def = index.content.controls.find((c) => c.id === 'ctl-mfa')!
    const control = state.controls.controls['ctl-mfa']!
    const startingFloor = control.coverage * def.driftFloor

    control.coverage = 0.95
    for (let i = 0; i < 700; i += 1) applyDrift(control, def, false)

    expect(control.coverage).toBeGreaterThan(startingFloor)
    expect(control.coverage).toBeCloseTo(0.95 * def.driftFloor, 2)
  })

  it('leaves a maintained control alone', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'drift-maintained' })
    const def = index.content.controls.find((c) => c.id === 'ctl-logging')!
    const control = state.controls.controls[def.id]!
    const before = { ...control }
    for (let i = 0; i < 200; i += 1) applyDrift(control, def, true)
    expect(control.coverage).toBe(before.coverage)
    expect(control.operationalEffectiveness).toBe(before.operationalEffectiveness)
    expect(control.exceptionRate).toBe(before.exceptionRate)
  })
})
