import type { AnnualReviewDimension } from '../types'

type Assessment = 'Difficult' | 'Mixed' | 'Credible' | 'Exceptional'
const VALUES = { weak: 0.2, developing: 0.45, solid: 0.68, strong: 0.88 } as const
const ORDER: Assessment[] = ['Difficult', 'Mixed', 'Credible', 'Exceptional']

/** Equal weights, with minimum standards that a good average cannot conceal. */
export function overallAssessment(dimensions: AnnualReviewDimension[], capabilityTested: boolean): {
  label: Assessment
  reason?: string
} {
  const average = dimensions.reduce((sum, dimension) => sum + VALUES[dimension.band], 0) / Math.max(1, dimensions.length)
  const base: Assessment = average > 0.78 ? 'Exceptional' : average > 0.6 ? 'Credible' : average > 0.42 ? 'Mixed' : 'Difficult'
  const weak = dimensions.filter((dimension) => dimension.band === 'weak')
  const critical = weak.filter((dimension) => dimension.id === 'prioritisation' || dimension.id === 'team-sustainability')
  let ceiling: Assessment = 'Exceptional'
  let reason: string | undefined
  if (weak.length >= 3) {
    ceiling = 'Difficult'
    reason = `three or more dimensions were weak: ${weak.map((dimension) => dimension.label.toLowerCase()).join(', ')}`
  } else if (critical.length > 0) {
    ceiling = 'Mixed'
    reason = `${critical.map((dimension) => dimension.label.toLowerCase()).join(' and ')} ${critical.length === 1 ? 'was' : 'were'} weak`
  } else if (weak.length > 0) {
    ceiling = 'Credible'
    reason = `${weak.map((dimension) => dimension.label.toLowerCase()).join(' and ')} ${weak.length === 1 ? 'was' : 'were'} weak`
  } else if (!capabilityTested) {
    ceiling = 'Credible'
    reason = 'recovery capability was not demonstrated by a completed exercise or a closed incident the organisation absorbed'
  }
  return ORDER.indexOf(base) > ORDER.indexOf(ceiling) ? { label: ceiling, reason } : { label: base }
}
