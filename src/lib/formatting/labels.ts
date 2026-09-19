/**
 * Presentation-only formatting. The engine speaks in bands and ids; this is
 * where they become the words a CISO would actually use.
 */
import type { BandTone } from '@/components/ui/primitives'
import type { RiskBand } from '@/game/types'

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

export function money(amount: number): string {
  if (Math.abs(amount) >= 1000) return `£${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}m`
  return `£${Math.round(amount)}k`
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`
}

export function dayLabel(day: number): string {
  return `Day ${day}`
}

const FUNCTION_SHORT_LABELS: Record<string, string> = {
  soc: 'SOC',
  engineering: 'Engineering',
  architecture: 'Architecture',
  grc: 'Cyber risk',
  iam: 'Identity',
  'incident-response': 'Incident response',
}

export function functionLabel(fn: string): string {
  return FUNCTION_SHORT_LABELS[fn] ?? fn
}
