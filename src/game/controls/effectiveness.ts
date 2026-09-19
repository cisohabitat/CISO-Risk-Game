/**
 * Controls are never binary (plan §2.7, §17). Effective strength combines
 * coverage, configuration quality, operating effectiveness and exceptions.
 * Monitoring quality is deliberately kept separate: a control can stop an
 * attacker without telling you it did, and vice versa.
 */
import type { AttackTechnique, ControlRuntime, SecurityControlDef } from '../types'
import { clamp01 } from '../types'

/**
 * Preventive strength (0..1).
 * Coverage dominates: a perfectly configured control over half the estate still
 * leaves the other half open. Configuration and operation act as multipliers
 * that can never fully cancel coverage, which keeps the curve readable.
 */
export function calculateControlEffectiveness(control: ControlRuntime): number {
  const configured = 0.35 + 0.65 * clamp01(control.configurationQuality)
  const operated = 0.35 + 0.65 * clamp01(control.operationalEffectiveness)
  const exceptionPenalty = 1 - 0.55 * clamp01(control.exceptionRate)
  return clamp01(clamp01(control.coverage) * configured * operated * exceptionPenalty)
}

/** Chance this control contributes to noticing activity it partially covers. */
export function calculateControlDetection(control: ControlRuntime, def: SecurityControlDef): number {
  const reach = clamp01(control.coverage) * clamp01(control.monitoringQuality)
  return clamp01(reach * def.detectionStrength)
}

/** How much this control shortens or softens consequences once something lands. */
export function calculateControlRecovery(control: ControlRuntime, def: SecurityControlDef): number {
  const operating = 0.3 + 0.7 * clamp01(control.operationalEffectiveness)
  return clamp01(clamp01(control.coverage) * operating * def.recoveryStrength)
}

/**
 * Combined resistance of a set of controls to one technique.
 * Controls compose multiplicatively (defence in depth) rather than additively,
 * so a second control of the same kind adds less than the first.
 */
export function resistanceToTechnique(
  technique: AttackTechnique,
  controls: { runtime: ControlRuntime; def: SecurityControlDef }[],
): number {
  let pass = 1
  for (const { runtime, def } of controls) {
    const applicability = def.mitigates[technique] ?? 0
    if (applicability <= 0) continue
    const strength = calculateControlEffectiveness(runtime) * applicability
    pass *= 1 - clamp01(strength)
  }
  return clamp01(1 - pass)
}

/** Detection likelihood across a set of controls for a single attacker step. */
export function detectionAcross(controls: { runtime: ControlRuntime; def: SecurityControlDef }[]): number {
  let miss = 1
  for (const { runtime, def } of controls) {
    miss *= 1 - calculateControlDetection(runtime, def)
  }
  return clamp01(1 - miss)
}

/** Qualitative band for a control dimension. Never show the raw number. */
export function controlBand(value: number): 'absent' | 'partial' | 'developing' | 'established' | 'strong' {
  if (value < 0.15) return 'absent'
  if (value < 0.35) return 'partial'
  if (value < 0.6) return 'developing'
  if (value < 0.82) return 'established'
  return 'strong'
}

/**
 * Controls decay when nothing maintains them: estates grow, exceptions
 * accumulate, configurations drift. An active programme offsets this.
 */
export function applyDrift(control: ControlRuntime, def: SecurityControlDef, maintained: boolean): void {
  if (maintained) return
  const drift = def.driftPerDay
  if (drift <= 0) return
  control.coverage = clamp01(control.coverage - drift)
  control.configurationQuality = clamp01(control.configurationQuality - drift * 0.6)
  control.exceptionRate = clamp01(control.exceptionRate + drift * 0.8)
}
