/**
 * Authored campaign content. These structures are immutable at runtime: they
 * ship as static JSON validated by Zod (see src/lib/schemas) and are never
 * written into the save file. A save references content by `contentId`.
 */
import type {
  AttackTechnique,
  CapacityDemand,
  ControlCategory,
  Criticality,
  CyberFunction,
  EventPriority,
  EventType,
  EvidenceSourceType,
  OrgEdgeType,
  OrgNodeType,
} from './primitives'
import type { GameEffect } from './effects'
import type { Condition } from './conditions'

export interface OrgNodeDef {
  id: string
  type: OrgNodeType
  name: string
  description: string
  criticality: Criticality
  /** Revealed at game start without any investigation. */
  knownAtStart: boolean
  /** Baseline internet/partner exposure of the node (0..1 truth). */
  exposure: number
  /** Baseline technical weakness of the node (0..1 truth). */
  weakness: number
  tags: string[]
  attributes?: Record<string, string | number | boolean>
}

export interface OrgEdgeDef {
  id: string
  from: string
  to: string
  type: OrgEdgeType
  description: string
  knownAtStart: boolean
  /**
   * Optional edges exist only in some seeds. `variantWeight` is the chance the
   * edge is part of the hidden truth for a given campaign (1 = always).
   */
  variantWeight: number
  tags: string[]
}

export interface BusinessServiceDef {
  id: string
  nodeId: string
  name: string
  description: string
  revenueShare: number
  outageToleranceHours: number
  regulatoryExposure: number
}

export interface BusinessObjectiveDef {
  id: string
  name: string
  description: string
  targetDay: number
  importance: 'medium' | 'high' | 'critical'
  dependencyNodeIds: string[]
  ownerStakeholderId: string
  /** Business value delivered when achieved, used by the annual review. */
  value: number
}

export interface StakeholderDef {
  id: string
  name: string
  role: string
  shortRole: string
  priorities: string[]
  baseCyberUnderstanding: number
  baseRiskTolerance: number
  baseTrust: number
  /** Seeded variation applied to the three base values (± this amount). */
  variance: number
  activeConcerns: string[]
  voice: string
}

export interface CyberLeaderDef {
  id: string
  name: string
  role: string
  functions: CyberFunction[]
  baseSkill: number
  baseReliability: number
  baseMorale: number
  strengths: string[]
  weaknesses: string[]
  variance: number
}

export interface SecurityControlDef {
  id: string
  name: string
  shortName: string
  category: ControlCategory
  description: string
  baseCoverage: number
  baseConfigurationQuality: number
  baseOperationalEffectiveness: number
  baseMonitoringQuality: number
  baseExceptionRate: number
  variance: number
  targetNodeIds: string[]
  /** Which attack techniques this control resists, and how strongly (0..1). */
  mitigates: Partial<Record<AttackTechnique, number>>
  /** Contribution to detecting activity at a step this control covers. */
  detectionStrength: number
  /** Contribution to recovery/consequence reduction. */
  recoveryStrength: number
  /** How well this control lets defenders act on what they see: push an actor out once noticed. */
  responseStrength?: number
  /** Ongoing degradation per day when no programme maintains it. */
  driftPerDay: number
  /** Which dimension erodes, and why. See applyDrift. */
  driftKind: 'coverage-erosion' | 'operational-decay' | 'exception-accumulation'
  /**
   * Share of the best level reached that survives unaided. 0.7 means a control
   * settles at roughly two thirds of its peak rather than decaying to nothing.
   */
  driftFloor: number
}

export interface ControlEffectDef {
  controlId: string
  coverage?: number
  configurationQuality?: number
  operationalEffectiveness?: number
  monitoringQuality?: number
  exceptionRate?: number
}

export interface ProgrammeMilestoneDef {
  id: string
  name: string
  atProgress: number
  description: string
  controlEffects: ControlEffectDef[]
  effects?: GameEffect[]
}

export interface ProgrammeBlockerDef {
  id: string
  name: string
  description: string
  /** Chance per day of appearing while the programme is active. */
  chancePerDay: number
  /** Progress multiplier while unresolved. */
  progressMultiplier: number
  resolution: {
    label: string
    budget?: number
    focus?: number
    stakeholderId?: string
    description: string
  }
}

export interface CyberProgrammeDef {
  id: string
  name: string
  shortName: string
  description: string
  rationale: string
  budgetCost: number
  durationDays: number
  capacityDemand: CapacityDemand
  preferredSponsorId: string
  businessFriction: number
  milestones: ProgrammeMilestoneDef[]
  blockers: ProgrammeBlockerDef[]
  tags: string[]
}

export interface ThreatActorDef {
  id: string
  name: string
  archetype: string
  motivation: string
  description: string
  capability: number
  persistence: number
  baseActivity: number
  variance: number
  targetPreferences: string[]
  techniquePreferences: AttackTechnique[]
  objective: 'disruption' | 'extortion' | 'theft' | 'espionage'
}

export interface AttackStepDef {
  id: string
  nodeId: string
  technique: AttackTechnique
  narrative: string
  /** Inherent difficulty of the step before controls (0..1, higher = harder). */
  difficulty: number
  controlIds: string[]
}

export interface AttackPathDef {
  id: string
  name: string
  summary: string
  actorAffinity: Partial<Record<string, number>>
  steps: AttackStepDef[]
  impactedServiceIds: string[]
  incidentFamilyId: string
  /** Baseline attractiveness before exposure/control evaluation. */
  attractiveness: number
}

export interface IncidentFamilyDef {
  id: string
  name: string
  description: string
  headline: string
  /** Base share of affected services taken out of operation (0..1). */
  baseDisruption: number
  baseDataImpact: number
  baseDurationDays: number
  regulatoryInterest: number
  responseDecisionIds: string[]
  /**
   * Authored lines for the reconstruction. A bare string is always true of
   * this family; a conditioned one is said only when the state agrees, so
   * "data held longer than the retention policy allowed" is not said to a
   * player who enforced the policy, and "backups that could not be reached"
   * is not said of backups that could.
   */
  whatHelped: (string | { text: string; when: Condition })[]
  whatHurt: (string | { text: string; when: Condition })[]
}

export interface EvidenceDef {
  id: string
  title: string
  description: string
  sourceType: EvidenceSourceType
  confidence: 'low' | 'medium' | 'high'
  affectedNodeIds: string[]
  tags: string[]
  /** True when this evidence is noise: severe-looking, immaterial. */
  noise: boolean
  /** Truth pointer used by the debrief to explain what the evidence meant. */
  interpretation: string
  expiresAfterDays?: number
}

export interface HypothesisTemplateDef {
  id: string
  title: string
  statement: string
  /** Evidence tags that support / contradict this hypothesis. */
  supportingTags: string[]
  contradictingTags: string[]
  linkedScenarioId: string
  requiresTags: string[]
}

export interface RiskScenarioDef {
  id: string
  title: string
  statement: string
  threatActorIds: string[]
  attackPathIds: string[]
  affectedServiceIds: string[]
  triggerNodeIds: string[]
  consequences: string[]
  treatmentProgrammeIds: string[]
  ownerStakeholderId: string
  family: string
}

export interface InvestigationDef {
  id: string
  name: string
  description: string
  /** Narrative shown while the work is running. */
  workingNarrative: string
  functions: CyberFunction[]
  capacityPerDay: CapacityDemand
  durationDays: number
  focusCost: number
  budgetCost: number
  /** Evidence that may be produced, weighted. */
  possibleEvidenceIds: string[]
  guaranteedEvidenceIds: string[]
  revealsNodeIds: string[]
  revealsEdgeIds: string[]
  /** Controls whose true state becomes known (assurance refresh). */
  assessesControlIds: string[]
  tags: string[]
  repeatable: boolean
  requiresCondition?: Condition
  /**
   * The question the enquiry answers. Seventeen enquiries in one flat list
   * read as a catalogue to every persona in the opening playtest; grouped by
   * the question, they read as choices.
   */
  theme: EnquiryTheme
}

export type EnquiryTheme = 'business-impact' | 'attack-paths' | 'identity-supplier' | 'recovery-response' | 'team-governance'

export const ENQUIRY_THEMES: { id: EnquiryTheme; label: string }[] = [
  { id: 'business-impact', label: 'What the business cannot lose' },
  { id: 'attack-paths', label: 'How an attacker would get in' },
  { id: 'identity-supplier', label: 'Identity and supplier access' },
  { id: 'recovery-response', label: 'Recovery and response' },
  { id: 'team-governance', label: 'Team and governance' },
]

export interface DecisionOptionDef {
  id: string
  label: string
  description: string
  /** Consequences the CISO could reasonably foresee. Never hidden effects. */
  visibleKnownEffects: string[]
  immediateEffects: GameEffect[]
  delayedEffects?: { dayOffset: number; effects: GameEffect[]; note?: string }[]
  requirements?: {
    budget?: number
    focus?: number
    minTrustStakeholderId?: string
    minTrust?: number
    condition?: Condition
  }
  /**
   * How the option's own cost is funded. The cost itself is the negative
   * `budget.change` in `immediateEffects` — stated once, as data, so it cannot
   * drift from what the reducer applies.
   *
   * - `discretionary` (the default): a purchase. Refused unless the year can
   *   pay for it, so nobody receives the benefit of something they could not
   *   afford.
   * - `imposed`: money taken from you rather than spent by you. Never refused;
   *   what is not there is simply not taken.
   * - `emergency`: may exceed the allocation, and the shortfall is recorded
   *   against the year as an unfunded commitment rather than vanishing.
   */
  budgetTreatment?: 'discretionary' | 'imposed' | 'emergency'
  rationaleTagIds?: string[]
  assumptionIds?: string[]
}

export interface DecisionDef {
  id: string
  title: string
  description: string
  context: string
  /** Days from creation until the option set expires (undefined = no deadline). */
  deadlineDays?: number
  /** Applied if the deadline passes with no answer. */
  defaultOptionId: string
  options: DecisionOptionDef[]
  requiresRationale: boolean
  /**
   * The reasons this decision can be taken for. Absent, the whole vocabulary
   * is offered. Present, the dialog offers only these and the engine refuses
   * the rest: "residual risk is within tolerance" was being recorded under
   * "stand up incident command now" and read back in the annual review.
   */
  rationaleTagIds?: string[]
  relatedNodeIds: string[]
  teaches?: string
}

export interface GameEventDef {
  id: string
  type: EventType
  title: string
  from: string
  body: string
  priority: EventPriority
  availableFromDay: number
  availableUntilDay?: number
  /** Conditions that must all hold for the event to fire. */
  conditions: Condition[]
  /** Relative likelihood once conditions hold. */
  weight: number
  /** Guaranteed narrative beat: fires as soon as conditions hold. */
  pinned: boolean
  /**
   * Fires only when something schedules it, never from the weighted daily
   * pool. Delayed consequences of a specific choice belong here: leaving them
   * in the pool dilutes every other event's chance of being drawn, so authoring
   * a callback would quietly cost the campaign some of its other content.
   */
  scheduledOnly?: boolean
  oncePerCampaign: boolean
  cooldownDays?: number
  effectsOnReveal?: GameEffect[]
  decisionId?: string
  relatedNodeIds: string[]
  tags: string[]
  /**
   * Other ways of saying a recurring message. The first firing uses the title
   * and body; later ones take the variants in turn and then start again, so a
   * message that arrives six times a year is not read word for word six times.
   */
  variants?: { title?: string; body: string }[]
}

export interface RationaleTagDef {
  id: string
  label: string
  description: string
  /** Debrief dimension this rationale speaks to. */
  dimension: string
}

export interface AssumptionDef {
  id: string
  statement: string
  /** Rule evaluated each day; when it fails the assumption is invalidated. */
  validationRuleId: string
  reviewAfterDays: number
  linkedNodeIds: string[]
}

export interface GlossaryEntryDef {
  id: string
  term: string
  definition: string
  guidedNote?: string
  /**
   * `game` (the default) is a word this game uses in its own way; `subject`
   * is a word the field uses that a player new to it will meet in the text.
   * Measured across the authored content: "privileged" 82 times, "credential"
   * 78, "segmentation" 52, "MFA" 35 — none of them defined anywhere.
   */
  section?: 'game' | 'subject'
}

export interface CampaignMeta {
  id: string
  title: string
  organisation: string
  summary: string
  openingBriefing: string
  durationDays: number
  startingBudget: number
  focusPerWeek: number
  version: string
}

/**
 * A starting situation: the predicament the CISO arrives into. The same
 * organisation, a different year. Chosen at the start or drawn from the seed.
 */
export interface SituationDef {
  id: string
  name: string
  /** One or two sentences for the start screen. */
  summary: string
  /** Added to the year's cyber budget, total and remaining alike, in £k. */
  budgetDelta?: number
  /** Applied through the effect reducer before the first day. */
  setupEffects: GameEffect[]
}

export interface CampaignContent {
  meta: CampaignMeta
  nodes: OrgNodeDef[]
  edges: OrgEdgeDef[]
  services: BusinessServiceDef[]
  objectives: BusinessObjectiveDef[]
  stakeholders: StakeholderDef[]
  leaders: CyberLeaderDef[]
  controls: SecurityControlDef[]
  programmes: CyberProgrammeDef[]
  actors: ThreatActorDef[]
  attackPaths: AttackPathDef[]
  incidentFamilies: IncidentFamilyDef[]
  evidence: EvidenceDef[]
  hypothesisTemplates: HypothesisTemplateDef[]
  riskScenarios: RiskScenarioDef[]
  investigations: InvestigationDef[]
  decisions: DecisionDef[]
  events: GameEventDef[]
  rationaleTags: RationaleTagDef[]
  assumptions: AssumptionDef[]
  glossary: GlossaryEntryDef[]
  situations?: SituationDef[]
}

/** Indexed view built once at load so the engine never scans arrays per tick. */
export interface ContentIndex {
  content: CampaignContent
  node: Map<string, OrgNodeDef>
  edge: Map<string, OrgEdgeDef>
  service: Map<string, BusinessServiceDef>
  objective: Map<string, BusinessObjectiveDef>
  stakeholder: Map<string, StakeholderDef>
  leader: Map<string, CyberLeaderDef>
  control: Map<string, SecurityControlDef>
  programme: Map<string, CyberProgrammeDef>
  actor: Map<string, ThreatActorDef>
  attackPath: Map<string, AttackPathDef>
  incidentFamily: Map<string, IncidentFamilyDef>
  evidence: Map<string, EvidenceDef>
  hypothesisTemplate: Map<string, HypothesisTemplateDef>
  riskScenario: Map<string, RiskScenarioDef>
  investigation: Map<string, InvestigationDef>
  decision: Map<string, DecisionDef>
  event: Map<string, GameEventDef>
  rationaleTag: Map<string, RationaleTagDef>
  assumption: Map<string, AssumptionDef>
  glossary: Map<string, GlossaryEntryDef>
  situation: Map<string, SituationDef>
  /** node id -> outgoing edges */
  outgoing: Map<string, OrgEdgeDef[]>
  incoming: Map<string, OrgEdgeDef[]>
  /** control id -> attack step ids it covers */
  controlSteps: Map<string, string[]>
}
