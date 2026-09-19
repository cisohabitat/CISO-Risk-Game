/**
 * Shared primitive vocabulary for the simulation.
 *
 * Domain rule: the engine reasons in unit-interval numbers (0..1) and converts
 * to qualitative bands only at the presentation boundary. Nothing in the UI
 * should ever render a raw internal number as a "score" (plan §2.9).
 */

export type Unit = number // conventionally clamped to 0..1

export type RiskBand = 'low' | 'moderate' | 'elevated' | 'high' | 'severe'
export type Criticality = 'low' | 'medium' | 'high' | 'critical'
export type ConfidenceBand = 'low' | 'medium' | 'high'
export type ScenarioConfidence = 'limited' | 'moderate' | 'strong'
export type RelationshipBand = 'resistant' | 'cautious' | 'neutral' | 'supportive' | 'trusted'
export type CapacityBand = 'available' | 'committed' | 'stretched' | 'overloaded' | 'breaking'
export type Difficulty = 'guided' | 'ciso' | 'high-pressure'
export type GameSpeed = 'paused' | '1x' | '2x' | '4x'

export type CyberFunction =
  | 'soc'
  | 'engineering'
  | 'architecture'
  | 'grc'
  | 'iam'
  | 'incident-response'

export const CYBER_FUNCTIONS: CyberFunction[] = [
  'soc',
  'engineering',
  'architecture',
  'grc',
  'iam',
  'incident-response',
]

export type CapacityDemand = Partial<Record<CyberFunction, number>>

export type OrgNodeType =
  | 'objective'
  | 'service'
  | 'application'
  | 'infrastructure'
  | 'cloud-platform'
  | 'identity'
  | 'network-zone'
  | 'supplier'
  | 'data-set'
  | 'control'

export type OrgEdgeType =
  | 'depends_on'
  | 'authenticates_via'
  | 'hosted_on'
  | 'administered_by'
  | 'connected_to'
  | 'supplied_by'
  | 'processes_data_for'
  | 'protects'
  | 'monitors'

export type EvidenceSourceType =
  | 'vulnerability'
  | 'audit'
  | 'threat-intel'
  | 'recovery-test'
  | 'architecture'
  | 'unsupported-technology'
  | 'supplier'
  | 'soc-signal'
  | 'staff-observation'
  | 'control-test'
  | 'business'
  | 'incident'

export type ControlCategory =
  | 'identity'
  | 'privileged-access'
  | 'network'
  | 'endpoint'
  | 'detection'
  | 'recovery'
  | 'third-party'
  | 'vulnerability'
  | 'cloud'

export type AttackTechnique =
  | 'phishing'
  | 'credential-stuffing'
  | 'supplier-remote-access'
  | 'exploit-public-app'
  | 'privilege-abuse'
  | 'lateral-movement'
  | 'data-exfiltration'
  | 'encryption-impact'
  | 'persistence'

export type CampaignStage =
  | 'interest'
  | 'reconnaissance'
  | 'initial-access'
  | 'foothold'
  | 'lateral-movement'
  | 'target-access'
  | 'action-on-objective'

export const CAMPAIGN_STAGES: CampaignStage[] = [
  'interest',
  'reconnaissance',
  'initial-access',
  'foothold',
  'lateral-movement',
  'target-access',
  'action-on-objective',
]

export type EventType =
  | 'business'
  | 'threat'
  | 'programme'
  | 'people'
  | 'supplier'
  | 'executive'
  | 'board'
  | 'discovery'
  | 'incident'
  | 'assumption'

export type EventPriority = 'routine' | 'notable' | 'urgent' | 'critical'

export type IncidentPhase =
  | 'signal'
  | 'escalation'
  | 'response'
  | 'containment'
  | 'consequence'
  | 'recovery'
  | 'debrief'
  | 'closed'

export type PauseReason =
  | 'incident'
  | 'board-decision'
  | 'decision-deadline'
  | 'assumption-invalidated'
  | 'quarter-end'
  | 'year-end'
  | 'player'

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

/** Day 0 is the first day in post. The MVP campaign is one 364-day year. */
export const CAMPAIGN_DAYS = 364
export const DAYS_PER_WEEK = 7
export const DAYS_PER_QUARTER = 91
