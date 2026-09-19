/**
 * The only place internal 0..1 values become player-visible language.
 * Plan §2.9: no universal cyber score, no "+12 risk".
 */
import type { RiskBand, ScenarioConfidence } from '../types'

export function riskBand(value: number): RiskBand {
  if (value < 0.16) return 'low'
  if (value < 0.34) return 'moderate'
  if (value < 0.55) return 'elevated'
  if (value < 0.75) return 'high'
  return 'severe'
}

export const RISK_BAND_LABEL: Record<RiskBand, string> = {
  low: 'Low',
  moderate: 'Moderate',
  elevated: 'Elevated',
  high: 'High',
  severe: 'Severe',
}

export const RISK_BAND_ORDER: RiskBand[] = ['low', 'moderate', 'elevated', 'high', 'severe']

export function confidenceFromUncertainty(uncertainty: number): ScenarioConfidence {
  if (uncertainty < 0.3) return 'strong'
  if (uncertainty < 0.6) return 'moderate'
  return 'limited'
}

export function confidenceBandLabel(confidence: ScenarioConfidence): string {
  return confidence === 'strong' ? 'Strong' : confidence === 'moderate' ? 'Moderate' : 'Limited'
}

export function compareBands(a: RiskBand, b: RiskBand): number {
  return RISK_BAND_ORDER.indexOf(a) - RISK_BAND_ORDER.indexOf(b)
}

/** Words for a movement between two assessments, without numbers. */
export function describeChange(previous: number | undefined, current: number): string {
  if (previous === undefined) return 'newly assessed'
  const delta = current - previous
  if (Math.abs(delta) < 0.04) return 'broadly unchanged'
  if (delta > 0.14) return 'materially worse'
  if (delta > 0) return 'worsening'
  if (delta < -0.14) return 'materially improved'
  return 'improving'
}
