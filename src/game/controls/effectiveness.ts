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
 * Controls decay when nothing maintains them, but not all for the same reason
 * and not without limit.
 *
 * Three shapes, because the causes are genuinely different:
 *
 *   coverage-erosion      the estate grows faster than deployment does, so the
 *                         control covers a smaller share of it each month
 *   operational-decay     the capability is still deployed but stops being
 *                         exercised — an unrehearsed plan, an untested restore.
 *                         Coverage is unchanged; it simply would not work well
 *   exception-accumulation standing exceptions pile up faster than anyone
 *                         retires them, hollowing the control from inside
 *
 * Decay runs toward a floor rather than toward zero. Capability that has been
 * built mostly persists: what erodes is the margin above it. The floor is a
 * share of the best that dimension has ever reached, so a programme that lifts
 * a control also lifts the level it will not fall below unaided.
 */
export function applyDrift(control: ControlRuntime, def: SecurityControlDef, maintained: boolean): void {
  // The high-water mark tracks upward regardless, so improvements stick.
  const peak = (control.peak ??= {
    coverage: control.coverage,
    configurationQuality: control.configurationQuality,
    operationalEffectiveness: control.operationalEffectiveness,
    monitoringQuality: control.monitoringQuality,
    exceptionRate: control.exceptionRate,
  })
  peak.coverage = Math.max(peak.coverage, control.coverage)
  peak.configurationQuality = Math.max(peak.configurationQuality, control.configurationQuality)
  peak.operationalEffectiveness = Math.max(peak.operationalEffectiveness, control.operationalEffectiveness)
  peak.monitoringQuality = Math.max(peak.monitoringQuality, control.monitoringQuality)
  // The best (lowest) exception rate reached; drift runs the other way here.
  peak.exceptionRate = Math.min(peak.exceptionRate, control.exceptionRate)

  if (maintained) return
  const drift = def.driftPerDay
  if (drift <= 0) return
  const retained = clamp01(def.driftFloor)

  switch (def.driftKind) {
    case 'operational-decay': {
      // Still deployed, no longer exercised.
      const floor = peak.operationalEffectiveness * retained
      control.operationalEffectiveness = Math.max(floor, control.operationalEffectiveness - drift)
      control.monitoringQuality = Math.max(
        peak.monitoringQuality * retained,
        control.monitoringQuality - drift * 0.5,
      )
      break
    }
    case 'exception-accumulation': {
      // Exceptions granted faster than they are retired. The ceiling is the
      // point at which the control is carrying about as much as it can.
      const ceiling = Math.min(0.85, peak.exceptionRate + (1 - retained))
      control.exceptionRate = Math.min(ceiling, control.exceptionRate + drift)
      control.configurationQuality = Math.max(
        peak.configurationQuality * retained,
        control.configurationQuality - drift * 0.4,
      )
      break
    }
    default: {
      // The estate outgrows the deployment.
      const floor = peak.coverage * retained
      control.coverage = Math.max(floor, control.coverage - drift)
      control.configurationQuality = Math.max(
        peak.configurationQuality * retained,
        control.configurationQuality - drift * 0.5,
      )
      break
    }
  }
}
