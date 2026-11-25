import type { AnnualReviewDimension } from '../types'

type Assessment = 'Difficult' | 'Mixed' | 'Credible' | 'Exceptional'
const VALUES = { weak: 0.2, developing: 0.45, solid: 0.68, strong: 0.88 } as const
const ORDER: Assessment[] = ['Difficult', 'Mixed', 'Credible', 'Exceptional']

/** Equal weights, with minimum standards that a good average cannot conceal. */
export function overallAssessment(dimensions: AnnualReviewDimension[], capabilityTested: boolean, objectives?: { met: number; total: number }, floor?: Assessment): {
  label: Assessment
  reason?: string
} {
  const average = dimensions.reduce((sum, dimension) => sum + VALUES[dimension.band], 0) / Math.max(1, dimensions.length)
  const base: Assessment = average > 0.78 ? 'Exceptional' : average > 0.6 ? 'Credible' : average > 0.42 ? 'Mixed' : 'Difficult'
  const weak = dimensions.filter((dimension) => dimension.band === 'weak')
  const critical = weak.filter((dimension) => dimension.id === 'prioritisation' || dimension.id === 'team-sustainability' || dimension.id === 'business-enablement')
  let ceiling: Assessment = 'Exceptional'
  let reason: string | undefined
  // A year that met one objective in five or fewer is Difficult, whatever
  // else held: 1 of 5 was rated Mixed while 4 of 5 was rated Difficult
  // (owner, 25 November: design issue C). Two of five was tried first and
  // made 13 of 25 competent CISO years Difficult once the mid-year incident
  // floor landed; one of five catches the inverted years the playtest found.
  if (objectives && objectives.total > 0 && objectives.met * 5 <= objectives.total) {
    ceiling = 'Difficult'
    reason = `the business met only ${objectives.met} of its ${objectives.total} objectives`
  } else if (weak.length >= 3) {
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
  const capped: { label: Assessment; reason?: string } = ORDER.indexOf(base) > ORDER.indexOf(ceiling) ? { label: ceiling, reason } : { label: base }
  // A floor the mode sets for a quiet, delivered year (design issue J).
  if (floor && ORDER.indexOf(capped.label) < ORDER.indexOf(floor)) return { label: floor, reason: 'a quiet year that delivered for the business is not rated below this on this difficulty' }
  return capped
}
