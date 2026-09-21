/**
 * The only place internal 0..1 values become player-visible language.
 * Plan §2.9: no universal cyber score, no "+12 risk".
 */
import type { RiskBand, ScenarioConfidence } from '../types'

/**
 * Five bands were authored and two were ever used. One cut list served three
 * different quantities, and it was cut for a 0..1 range none of them reach:
 * measured weekly over 24 campaigns, residual spans 0.08 to 0.38, exposure
 * 0.10 to 0.28 and consequence 0.06 to 0.58. Against cuts at 0.16 / 0.34 /
 * 0.55 / 0.75, 87% of the rows a player ever read said `moderate`, `high` and
 * `severe` never appeared at all, and an incident that had actually damaged
 * the business was described as moderate.
 *
 * Each quantity now has cuts fitted to the range it can reach, with headroom
 * above the worst observed so a worse year can still read worse. They stay
 * absolute, not percentiles: a risk the player has genuinely reduced has to
 * come down a band, which a moving scale would hide. A row moves by 0.001 in
 * a median week and 0.004 at the ninetieth percentile, so bands this close
 * together still read as change rather than as flicker.
 */
const RESIDUAL_CUTS = [0.14, 0.21, 0.28, 0.36]
const EXPOSURE_CUTS = [0.13, 0.17, 0.21, 0.26]
/** Shared with an incident's consequence, which is the same question asked after the fact. */
const CONSEQUENCE_CUTS = [0.15, 0.25, 0.38, 0.52]

function cut(value: number, cuts: number[]): RiskBand {
  if (value < cuts[0]!) return 'low'
  if (value < cuts[1]!) return 'moderate'
  if (value < cuts[2]!) return 'elevated'
  if (value < cuts[3]!) return 'high'
  return 'severe'
}

/** How exposed the business is left after the controls that are really there. */
export function residualBand(value: number): RiskBand {
  return cut(value, RESIDUAL_CUTS)
}

/** How reachable the scenario is: the viability of its best path, under pressure. */
export function exposureBand(value: number): RiskBand {
  return cut(value, EXPOSURE_CUTS)
}

/** What it would cost the business, and what an incident did cost it. */
export function consequenceBand(value: number): RiskBand {
  return cut(value, CONSEQUENCE_CUTS)
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

/**
 * Words for a movement between two assessments, without numbers. Cut against
 * the same measured range as the bands: residual moves by 0.001 in a median
 * week, so a 0.14 swing was a movement the simulation could not produce and
 * "materially worse" was a phrase the game could not say.
 */
export const MATERIAL_MOVE = 0.05

export function describeChange(previous: number | undefined, current: number): string {
  if (previous === undefined) return 'newly assessed'
  const delta = current - previous
  if (Math.abs(delta) < 0.012) return 'broadly unchanged'
  if (delta > MATERIAL_MOVE) return 'materially worse'
  if (delta > 0) return 'worsening'
  if (delta < -MATERIAL_MOVE) return 'materially improved'
  return 'improving'
}
