/**
 * The single canonical, serialisable game state (plan §37).
 *
 * Rules enforced by tests:
 *  - no functions, class instances, Map/Set or Date objects live in here;
 *  - everything needed to reproduce a run is state + seed + content id;
 *  - derived values are computed by selectors, not stored, unless noted.
 */
import type {
  CampaignStage,
  Criticality,
  CyberFunction,
  Difficulty,
  EventPriority,
  EventType,
  GameSpeed,
  IncidentPhase,
  PauseReason,
} from './primitives'
import type { GameEffect } from './effects'

export const SAVE_SCHEMA_VERSION = 4

export interface OrgNodeState {
  id: string
  /** Hidden truth: present in this campaign's world. */
  exists: boolean
  discovered: boolean
  discoveryConfidence: number
  /**
   * Whether the player established this themselves rather than inheriting it
   * or hearing it mentioned. The inherited register is belief, not knowledge,
   * so the annual review scores what was actually examined. Optional, so saves
   * written before it existed load without migration.
   */
  verified?: boolean
  exposure: number
  weakness: number
  criticalityOverride?: Criticality
  retiredOnDay?: number
  notes: string[]
}

export interface OrgEdgeState {
  id: string
  exists: boolean
  discovered: boolean
  discoveryConfidence: number
  /** As for nodes: established by the player's own work, not inherited. */
  verified?: boolean
}

export interface OrganisationState {
  nodes: Record<string, OrgNodeState>
  edges: Record<string, OrgEdgeState>
  /** Aggregate picture of how well the CISO understands each domain (0..1). */
  understanding: Record<string, number>
}

export interface ControlRuntime {
  id: string
  coverage: number
  configurationQuality: number
  operationalEffectiveness: number
  monitoringQuality: number
  exceptionRate: number
  /**
   * The best each dimension has reached. Drift runs toward a share of this, so
   * capability that has been built does not evaporate. Lazily initialised, so
   * saves written before it existed load without migration.
   */
  peak?: {
    coverage: number
    configurationQuality: number
    operationalEffectiveness: number
    monitoringQuality: number
    exceptionRate: number
  }
  /** What the player currently believes, refreshed by assurance activity. */
  believed: {
    coverage: number
    configurationQuality: number
    operationalEffectiveness: number
    monitoringQuality: number
    exceptionRate: number
    assessedOnDay: number
  } | null
}

export interface ControlState {
  controls: Record<string, ControlRuntime>
}

export interface ProgrammeRuntime {
  id: string
  status: 'proposed' | 'active' | 'paused' | 'complete' | 'at-risk'
  progress: number
  startedDay?: number
  completedDay?: number
  budgetAllocated: number
  budgetSpent: number
  /** 0..1 share of the programme's capacity demand actually being met. */
  staffing: number
  sponsorId?: string
  blockers: { id: string; startedDay: number; resolved: boolean }[]
  completedMilestoneIds: string[]
  deliveryFriction: number
  accelerated: boolean
}

export interface ProgrammeState {
  programmes: Record<string, ProgrammeRuntime>
}

export interface ThreatCampaignState {
  id: string
  actorId: string
  pathId: string
  stage: CampaignStage
  stepIndex: number
  stepProgress: number
  startedDay: number
  lastAdvanceDay: number
  detected: boolean
  detectedStage?: CampaignStage
  disrupted: boolean
  disruptedDay?: number
  incidentId?: string
  evidenceRaisedIds: string[]
}

export interface ThreatActorRuntime {
  id: string
  activityLevel: number
  interest: number
  pressure: number
  discovered: boolean
  lastCampaignDay?: number
  setbackUntilDay?: number
}

export interface ThreatState {
  actors: Record<string, ThreatActorRuntime>
  campaigns: ThreatCampaignState[]
  /** Sector-wide threat level, moved by world events. */
  sectorPressure: number
}

export interface EvidenceRuntime {
  id: string
  discoveredDay: number
  sourceLabel: string
  read: boolean
  archived: boolean
  linkedHypothesisIds: string[]
  expiresOnDay?: number
}

export interface EvidenceState {
  items: Record<string, EvidenceRuntime>
  order: string[]
}

export interface HypothesisRuntime {
  id: string
  templateId: string
  title: string
  statement: string
  createdDay: number
  supportingEvidenceIds: string[]
  contradictingEvidenceIds: string[]
  confidence: 'low' | 'medium' | 'high'
  status: 'draft' | 'investigating' | 'validated' | 'rejected' | 'converted'
  note?: string
  linkedScenarioId?: string
}

export interface RiskScenarioRuntime {
  id: string
  openedDay: number
  status: 'emerging' | 'open' | 'accepted' | 'treated' | 'closed'
  confidence: 'limited' | 'moderate' | 'strong'
  ownerStakeholderId: string
  decisionIds: string[]
  assumptionIds: string[]
  nextReviewDay: number
  acceptedUntilDay?: number
  lastAssessed: {
    day: number
    exposure: number
    consequence: number
    residual: number
  } | null
  /**
   * The residual when this scenario was first assessed, kept so the player can
   * be told which way it has moved since. Optional because a save written
   * before it existed takes its baseline from the next assessment after loading.
   */
  firstAssessed?: { day: number; residual: number }
  escalatedToBoard: boolean
  notes: string[]
}

export interface RiskState {
  hypotheses: Record<string, HypothesisRuntime>
  scenarios: Record<string, RiskScenarioRuntime>
  hypothesisCounter: number
  /**
   * True residual of every authored scenario on day one, before the player
   * touched anything — the world as it was handed over.
   *
   * Prioritisation is judged against this rather than against the year-end
   * picture, because a programme that worked pushes its scenario's residual
   * down, and scoring the end state would read that success as having spent
   * the year on something immaterial. It is the same trap that once emptied
   * the board pack for the player who had done the most.
   *
   * Covers all authored scenarios, not the ~45% the inherited register
   * happens to mention: finding the material ones nobody wrote down is the
   * job. Optional so saves written before it existed load without migration.
   */
  initialMateriality?: Record<string, number>
  /**
   * Patterns the game offered and the player judged not worth pursuing. Kept so
   * a dismissed suggestion stays dismissed; optional so saves written before it
   * existed load without migration.
   */
  dismissedPatternIds?: string[]
}

export interface StakeholderRuntime {
  id: string
  trust: number
  cyberUnderstanding: number
  riskTolerance: number
  concerns: string[]
  memory: { day: number; summary: string; sentiment: 'positive' | 'negative' | 'neutral' }[]
}

export interface StakeholderState {
  stakeholders: Record<string, StakeholderRuntime>
  boardConfidence: number
  operationalTolerance: number
}

export interface LeaderRuntime {
  id: string
  skill: number
  reliability: number
  morale: number
  workload: number
  assignmentsCompleted: number
  assignmentsLate: number
}

export interface FunctionRuntime {
  fn: CyberFunction
  capacity: number
  committed: number
  morale: number
  vacancies: number
  hiringDaysRemaining?: number
  /** Short-lived unplanned load on top of committed work; decays daily. */
  surge?: number
}

export interface AssignmentState {
  id: string
  kind: 'investigation' | 'programme-oversight' | 'supplier-review' | 'incident-preparation' | 'control-review'
  refId: string
  title: string
  leaderId: string
  startedDay: number
  dueDay: number
  progress: number
  capacityPerDay: Partial<Record<CyberFunction, number>>
  status: 'running' | 'complete' | 'abandoned'
  /** Determined on completion from leader skill/workload; drives output quality. */
  quality: number
  delivered: boolean
  resultSummary?: string
  producedEvidenceIds: string[]
}

export interface TeamState {
  functions: Record<string, FunctionRuntime>
  leaders: Record<string, LeaderRuntime>
  assignments: AssignmentState[]
  assignmentCounter: number
}

export interface InboxMessage {
  id: string
  day: number
  from: string
  subject: string
  body: string
  type: EventType
  priority: EventPriority
  read: boolean
  pinned: boolean
  decisionId?: string
  relatedNodeIds: string[]
  eventId?: string
}

export interface InboxState {
  messages: InboxMessage[]
  counter: number
}

export interface EventState {
  firedEventIds: string[]
  firedOnDay: Record<string, number>
  suppressedEventIds: string[]
  scheduled: { eventId: string; day: number }[]
  lastFiredDayByTag: Record<string, number>
  dailyFiredCount: number
}

export interface DecisionRuntime {
  id: string
  defId: string
  eventId?: string
  createdDay: number
  deadlineDay?: number
  selectedOptionId?: string
  resolvedDay?: number
  resolvedByDefault: boolean
  rationaleTagIds: string[]
  note?: string
  assumptionIds: string[]
  scenarioId?: string
}

export interface DecisionState {
  decisions: Record<string, DecisionRuntime>
  openIds: string[]
  resolvedIds: string[]
  counter: number
}

export interface AssumptionRuntime {
  id: string
  defId: string
  statement: string
  createdDay: number
  linkedDecisionId?: string
  linkedScenarioIds: string[]
  linkedNodeIds: string[]
  status: 'valid' | 'uncertain' | 'invalidated'
  /**
   * Whether the assumption was actually true at the moment it was recorded.
   * False means the player relied on something that was never the case, which
   * the simulation surfaces only once their knowledge catches up.
   */
  heldWhenRecorded: boolean
  invalidatedDay?: number
  invalidationReason?: string
  reviewedDay?: number
  nextReviewDay?: number
  acknowledged: boolean
}

export interface AssumptionState {
  assumptions: Record<string, AssumptionRuntime>
  counter: number
}

export interface IncidentRuntime {
  id: string
  familyId: string
  campaignId?: string
  actorId?: string
  pathId?: string
  startedDay: number
  phase: IncidentPhase
  phaseEnteredDay: number
  containment: number
  recovery: number
  consequence: number
  dataImpact: number
  affectedServiceIds: string[]
  decisionsTaken: { decisionId: string; optionId: string; day: number }[]
  detectionDay?: number
  resolvedDay?: number
  /** Assembled at debrief: what helped / hurt, drawn from actual world state. */
  reconstruction?: {
    pathSummary: { stepId: string; nodeName: string; narrative: string; controlNames: string[]; wasBlocked: boolean }[]
    helped: string[]
    hurt: string[]
    relatedDecisionIds: string[]
    relatedAssumptionIds: string[]
    narrative: string
  }
  externalSupport: boolean
  commandActivated: boolean
  boardInformedDay?: number
}

export interface IncidentState {
  incidents: Record<string, IncidentRuntime>
  order: string[]
  counter: number
  activeId?: string
}

export interface ResourceState {
  budgetTotal: number
  budgetRemaining: number
  budgetCommitted: number
  focusPerWeek: number
  focusRemaining: number
  weekIndex: number
  /**
   * Spend committed beyond the year's allocation, in the same units as the
   * budget. Only emergency options can create it. It exists so a shortfall is
   * carried and answered for rather than absorbed by the floor on
   * `budget.change`: a player who keeps a reserve should not finish level with
   * one who spent everything and then took unfunded emergency support.
   */
  unfundedCommitment: number
}

export interface BusinessObjectiveRuntime {
  id: string
  progress: number
  status: 'planned' | 'active' | 'at-risk' | 'achieved' | 'failed'
  targetDay: number
  delayDays: number
  conditionsAttached: string[]
  securitySupported: boolean
}

export interface BusinessState {
  objectives: Record<string, BusinessObjectiveRuntime>
  /** Service availability, driven by incidents (0..1 of normal operation). */
  serviceHealth: Record<string, number>
  outageDays: Record<string, number>
}

export interface HistoryEntry {
  day: number
  kind: string
  summary: string
  refs?: string[]
}

export interface WeeklySnapshot {
  day: number
  residualExposure: number
  boardConfidence: number
  teamStrain: number
  budgetRemaining: number
  programmeProgress: number
  threatPressure: number
}

export interface HistoryState {
  entries: HistoryEntry[]
  weekly: WeeklySnapshot[]
  decisionsLog: { day: number; decisionId: string; optionId: string; rationaleTagIds: string[] }[]
}

export interface QuarterReviewState {
  quarter: number
  day: number
  topicsChosen: string[]
  recommendationIds: string[]
  uncertaintyCommunicated: boolean
  boardReaction: string
  completed: boolean
}

export interface ReviewState {
  quarters: QuarterReviewState[]
  pendingQuarter?: number
  annual?: AnnualReview
}

export interface AnnualReviewDimension {
  id: string
  label: string
  band: 'weak' | 'developing' | 'solid' | 'strong'
  narrative: string
  evidence: string[]
}

export interface AnnualReview {
  day: number
  dimensions: AnnualReviewDimension[]
  narrative: string[]
  headline: string
  performanceBand: string
  businessOutcome: string
  blindSpots: string[]
  /**
   * The reasons the player gave for their choices, and how they held up.
   * Optional because a finished campaign's review is stored in the save, and
   * one written before this existed cannot have it reconstructed — the section
   * is simply absent there rather than the debrief failing to open.
   */
  reasoning?: ReasoningLine[]
}

export interface ReasoningLine {
  tagId: string
  label: string
  uses: number
  /** Risks carried on this reasoning that reached the business anyway. */
  materialised: number
  /** Assumptions recorded alongside it that turned out not to hold. */
  assumptionsFailed: number
  verdict: string
}

export interface TutorialState {
  seen: string[]
  dismissed: string[]
}

export interface PendingEffect {
  id: string
  day: number
  effects: GameEffect[]
  note?: string
  source: string
}

export interface GameState {
  schemaVersion: number
  gameId: string
  seed: string
  contentId: string
  contentVersion: string
  difficulty: Difficulty
  createdAtIso: string
  currentDay: number
  speed: GameSpeed
  paused: boolean
  pauseReasons: PauseReason[]
  rngCursor: number
  finished: boolean

  organisation: OrganisationState
  business: BusinessState
  threats: ThreatState
  controls: ControlState
  programmes: ProgrammeState
  risks: RiskState
  evidence: EvidenceState
  stakeholders: StakeholderState
  team: TeamState
  inbox: InboxState
  events: EventState
  decisions: DecisionState
  assumptions: AssumptionState
  incidents: IncidentState
  resources: ResourceState
  history: HistoryState
  reviews: ReviewState
  tutorial: TutorialState
  pendingEffects: PendingEffect[]
  flags: Record<string, number | string | boolean>
}
