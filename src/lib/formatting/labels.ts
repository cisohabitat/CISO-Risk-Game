/**
 * Presentation-only formatting. The engine speaks in bands and ids; this is
 * where they become the words a CISO would actually use.
 */
import type { BandTone } from '@/components/ui/primitives'
import type { RiskBand } from '@/game/types'
import { formatGameDate } from '@/game/time'

/**
 * "2 Jan", for lists too narrow for the whole date. Anything the player reads
 * is dated as the header dates it; "day 112" is the engine's word, not theirs.
 */
const YEAR_LENGTH = 365

/**
 * "4 of 5 left", or "5 of 5 left, and 1 extra" when a decision has given the
 * week more than it holds: "6 of 5 left" read as a fault.
 */
export function attentionLeft(remaining: number, perWeek: number, short = false): string {
  if (remaining <= perWeek) return short ? `${remaining}/${perWeek}` : `${remaining} of ${perWeek} left`
  const extra = remaining - perWeek
  return short ? `${perWeek}/${perWeek} +${extra}` : `${perWeek} of ${perWeek} left, and ${extra} extra`
}

/** "1.5 days a week", as the Team screen counts capacity. */
export function daysAWeek(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'} a week`
}

export function shortDate(day: number): string {
  // A second year keeps the first's dates, counted back from its own start.
  // They read "1 Jan" when the calendar was clamped at zero, so last year's
  // evidence looked like this morning's (second-year AI playtest).
  if (day < 0) return day >= -YEAR_LENGTH ? 'last year' : 'earlier'
  const { label, month } = formatGameDate(day)
  return label.replace(month, month.slice(0, 3))
}

export function bandTone(band: RiskBand): BandTone {
  return band
}

export function capacityTone(band: string): BandTone {
  switch (band) {
    case 'available':
      return 'low'
    case 'committed':
      return 'moderate'
    case 'stretched':
      return 'elevated'
    case 'overloaded':
      return 'high'
    default:
      return 'severe'
  }
}

export function relationshipTone(band: string): BandTone {
  switch (band) {
    case 'trusted':
      return 'low'
    case 'supportive':
      return 'moderate'
    case 'neutral':
      return 'neutral'
    case 'cautious':
      return 'elevated'
    default:
      return 'high'
  }
}

/**
 * A risk's movement since it was first assessed, as a badge. Unchanged gets no
 * badge at all: a register that has not moved should stay quiet, so the badges
 * that do appear are the ones worth reading.
 */
export function trendBadge(trend: string | undefined): { label: string; tone: BandTone } | undefined {
  switch (trend) {
    case 'improving':
      return { label: 'Improving', tone: 'positive' }
    case 'materially improved':
      return { label: 'Materially improved', tone: 'positive' }
    case 'worsening':
      return { label: 'Worsening', tone: 'warning' }
    case 'materially worse':
      return { label: 'Materially worse', tone: 'high' }
    default:
      return undefined
  }
}

export function confidenceTone(confidence: string): BandTone {
  return confidence === 'strong' ? 'low' : confidence === 'moderate' ? 'moderate' : 'elevated'
}

export function controlBandTone(band: string): BandTone {
  switch (band) {
    case 'strong':
      return 'low'
    case 'established':
      return 'moderate'
    case 'developing':
      return 'elevated'
    case 'partial':
      return 'high'
    default:
      return 'severe'
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    emerging: 'Emerging',
    open: 'Open',
    accepted: 'Accepted',
    treated: 'Being treated',
    closed: 'Closed',
    proposed: 'Not started',
    active: 'Under way',
    paused: 'Paused',
    complete: 'Complete',
    'at-risk': 'At risk',
    draft: 'Draft',
    investigating: 'Investigating',
    validated: 'Validated',
    rejected: 'Set aside',
    converted: 'Became a risk',
    valid: 'Holding',
    uncertain: 'Needs review',
    invalidated: 'No longer holds',
    signal: 'First signal',
    escalation: 'Escalating',
    response: 'Response',
    containment: 'Containment',
    consequence: 'Counting the damage',
    recovery: 'Recovery',
    debrief: 'Debrief',
    planned: 'Planned',
    achieved: 'Achieved',
    failed: 'Missed',
  }
  return map[status] ?? status
}

export function nodeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    service: 'Business service',
    application: 'Application',
    infrastructure: 'Infrastructure',
    'cloud-platform': 'Cloud platform',
    identity: 'Identity',
    'network-zone': 'Network zone',
    supplier: 'Supplier',
    'data-set': 'Data',
    control: 'Control',
    objective: 'Objective',
  }
  return map[type] ?? type
}

export function evidenceSourceLabel(source: string): string {
  const map: Record<string, string> = {
    vulnerability: 'Vulnerability management',
    audit: 'Audit',
    'threat-intel': 'Threat intelligence',
    'recovery-test': 'Recovery test',
    architecture: 'Architecture',
    'unsupported-technology': 'Unsupported technology',
    supplier: 'Supplier',
    'soc-signal': 'SOC',
    'staff-observation': 'Staff observation',
    'control-test': 'Control testing',
    business: 'Business',
    incident: 'Incident',
  }
  return map[source] ?? source
}

// One implementation, in the engine, because the engine needs it too and
// cannot import this module.
export { money } from '@/game/types'

export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`
}

/** The year view's marks, dated as the rest of the game dates things. */
export function dayLabel(day: number): string {
  return shortDate(day)
}

// One map of function names, in the engine, because the engine's messages
// need them too. The screen's label is the prose name capitalised, so a
// message about "identity" and a card titled "Identity" are the same word.
export { functionTitle as functionLabel } from '@/game/team/capacity'
