/**
 * Derived, player-facing views of the game state (plan §40).
 *
 * Simulation truth and UI formatting are kept apart: selectors convert internal
 * numbers into the bands, labels and orderings the screens render, and they
 * never leak a value the player should not see.
 */
import type {
  AssignmentState,
  ContentIndex,
  EvidenceDef,
  GameState,
  HypothesisTemplateDef,
  InboxMessage,
  RiskBand,
} from '@/game/types'
import { CYBER_FUNCTIONS, DAYS_PER_QUARTER, clamp01, money } from '@/game/types'
import { riskBand } from '@/game/risk/bands'
import type { IconName } from '@/components/ui/icons'
import { optionBudgetCost } from '@/game/engine/orchestrator'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { calculateControlEffectiveness, controlBand } from '@/game/controls/effectiveness'
import { capacityBand, functionStrain, functionTitle, moraleLabel, teamStrain } from '@/game/team/capacity'
import { boardConfidenceLabel, relationshipBand } from '@/game/stakeholders/relationships'
import { deliveryConfidence, deliveryConfidenceLabel } from '@/game/programmes/progression'
import { statusLabel } from '@/lib/formatting/labels'
import { unexaminedMaterial } from '@/game/knowledge/discovery'
import { renderDecisionText } from '@/game/decisions/describe'
import { formatGameDate } from '@/game/time'

export { formatGameDate }

export function currentQuarter(day: number): number {
  return Math.min(4, Math.floor(day / DAYS_PER_QUARTER) + 1)
}

export interface VisibleRisk {
  id: string
  title: string
  statement: string
  status: string
  band: RiskBand
  exposureBand: RiskBand
  consequenceBand: RiskBand
  confidence: 'limited' | 'moderate' | 'strong'
  ownerName: string
  ownerRole: string
  reviewDue: boolean
  daysUntilReview: number
  affectedServices: string[]
  treatmentProgrammeIds: string[]
  assumptionIds: string[]
  hasInvalidatedAssumption: boolean
  /**
   * Whether the player has ever assessed this scenario. Missing assessments
   * used to default to 0 and come out of `riskBand` as `low`, so "we have not
   * looked at this" and "we looked, and it is fine" were the same row. The
   * bands below are only meaningful when this is true.
   */
  assessed: boolean
}

export function visibleRisks(state: GameState, index: ContentIndex): VisibleRisk[] {
  const out: VisibleRisk[] = []
  for (const runtime of Object.values(state.risks.scenarios)) {
    const def = index.riskScenario.get(runtime.id)
    if (!def) continue
    const assessed = runtime.lastAssessed
    const owner = index.stakeholder.get(runtime.ownerStakeholderId)
    const hasInvalidatedAssumption = runtime.assumptionIds.some(
      (id) => state.assumptions.assumptions[id]?.status === 'invalidated',
    )
    out.push({
      id: runtime.id,
      title: def.title,
      statement: def.statement,
      status: runtime.status,
      band: riskBand(assessed?.residual ?? 0),
      exposureBand: riskBand(assessed?.exposure ?? 0),
      consequenceBand: riskBand(assessed?.consequence ?? 0),
      confidence: runtime.confidence,
      ownerName: owner?.name ?? 'Unassigned',
      ownerRole: owner?.shortRole ?? '',
      reviewDue: state.currentDay >= runtime.nextReviewDay,
      daysUntilReview: runtime.nextReviewDay - state.currentDay,
      affectedServices: def.affectedServiceIds
        .map((serviceId) => index.service.get(serviceId)?.name)
        .filter((name): name is string => Boolean(name)),
      treatmentProgrammeIds: def.treatmentProgrammeIds,
      assumptionIds: runtime.assumptionIds,
      hasInvalidatedAssumption,
      assessed: Boolean(assessed),
    })
  }
  const order: Record<string, number> = { severe: 0, high: 1, elevated: 2, moderate: 3, low: 4 }
  // Within a band, the list is ordered by the assessment itself. The bands
  // are the words the player sees; the order is not a number and shows none,
  // but it is the one thing that separates ten "moderate" rows. Measured over
  // 20 campaigns per mode, 86% of the rows a player ever sees read moderate,
  // and sorted by band alone the list fell into content order — the scenario
  // the annual review then grades their prioritisation against was first in
  // the list in 1 to 4 campaigns of 20, whatever they did.
  const residualOf = (risk: VisibleRisk): number => state.risks.scenarios[risk.id]?.lastAssessed?.residual ?? 0
  // Unassessed last, but never folded in among the low ones: an absence of
  // evidence is not a low rating, and sorting it as one buries the thing the
  // player most needs to go and look at.
  return out.sort((a, b) => {
    if (a.assessed !== b.assessed) return a.assessed ? -1 : 1
    return (order[a.band] ?? 5) - (order[b.band] ?? 5) || residualOf(b) - residualOf(a)
  })
}

/**
 * What belongs in front of the player.
 *
 * Accepting a risk changes the decision record; it does not reduce the
 * exposure. Filtering `accepted` out meant a material risk vanished from "your
 * top concerns" precisely because the player had taken responsibility for it —
 * teaching that acceptance is a way to make something go away, which is the
 * opposite of the lesson. Accepted risks stay, and the view marks them as
 * carried rather than handled. Only closed ones drop off.
 */
export function topConcerns(state: GameState, index: ContentIndex, limit = 3): VisibleRisk[] {
  return visibleRisks(state, index)
    .filter((risk) => risk.status !== 'closed')
    .slice(0, limit)
}

export interface OpenDecisionView {
  id: string
  defId: string
  title: string
  description: string
  context: string
  teaches?: string
  requiresRationale: boolean
  /** The reasons offered for this decision; undefined means the whole vocabulary. */
  rationaleTagIds?: string[]
  daysRemaining?: number
  urgent: boolean
  options: {
    id: string
    label: string
    description: string
    visibleKnownEffects: string[]
    budgetCost?: number
    exceedsBudget: boolean
    affordable: boolean
    blockedReason?: string
  }[]
}

export function openDecisions(state: GameState, index: ContentIndex): OpenDecisionView[] {
  const views: OpenDecisionView[] = []
  for (const id of state.decisions.openIds) {
      const runtime = state.decisions.decisions[id]
      if (!runtime) continue
      const def = index.decision.get(runtime.defId)
      if (!def) continue
      const daysRemaining = runtime.deadlineDay === undefined ? undefined : runtime.deadlineDay - state.currentDay
      views.push({
        id,
        defId: def.id,
        title: def.title,
        description: renderDecisionText(def.description, state, index, runtime),
        context: renderDecisionText(def.context, state, index, runtime),
        teaches: DIFFICULTY_PROFILES[state.difficulty].showsDecisionCoaching ? def.teaches : undefined,
        requiresRationale: def.requiresRationale,
        rationaleTagIds: def.rationaleTagIds,
        daysRemaining,
        urgent: daysRemaining !== undefined && daysRemaining <= 2,
        options: def.options.map((option) => {
          const requirements = option.requirements
          // What it costs, derived from the option's own effects so the card
          // cannot disagree with what gets spent. A known price belongs on the
          // card: the uncertainty in this game is what an option will do, never
          // what the organisation already knows it charges.
          const budgetCost = optionBudgetCost(option)
          const treatment = option.budgetTreatment ?? 'discretionary'
          let blockedReason: string | undefined
          if (treatment === 'discretionary' && budgetCost > 0 && state.resources.budgetRemaining < budgetCost) {
            blockedReason = `Not enough budget remains this year (${money(budgetCost)})`
          } else if (requirements?.budget && state.resources.budgetRemaining < requirements.budget) {
            blockedReason = 'Not enough budget remains this year'
          } else if (requirements?.focus && state.resources.focusRemaining < requirements.focus) {
            blockedReason = 'No attention left this week'
          } else if (requirements?.minTrustStakeholderId && requirements.minTrust !== undefined) {
            const person = state.stakeholders.stakeholders[requirements.minTrustStakeholderId]
            if (!person || person.trust < requirements.minTrust) {
              blockedReason = `${index.stakeholder.get(requirements.minTrustStakeholderId)?.name ?? 'That executive'} will not back this yet`
            }
          }
          return {
            id: option.id,
            label: option.label,
            description: option.description,
            visibleKnownEffects: option.visibleKnownEffects,
            budgetCost: budgetCost > 0 ? budgetCost : undefined,
            // Emergency spend is the one thing the year will let you commit
            // without the money, so the card says so before it is taken.
            exceedsBudget: budgetCost > 0 && treatment === 'emergency' && state.resources.budgetRemaining < budgetCost,
            affordable: !blockedReason,
            blockedReason,
          }
        }),
      })
  }
  return views.sort((a, b) => (a.daysRemaining ?? 99) - (b.daysRemaining ?? 99))
}

export interface EvidenceView {
  id: string
  title: string
  description: string
  source: string
  sourceLabel: string
  confidence: 'low' | 'medium' | 'high'
  day: number
  read: boolean
  tags: string[]
  affectedNames: string[]
  linkedHypothesisIds: string[]
}

export function evidenceList(state: GameState, index: ContentIndex): EvidenceView[] {
  const views: EvidenceView[] = []
  for (const id of state.evidence.order) {
      const runtime = state.evidence.items[id]
      const def = index.evidence.get(id)
      if (!runtime || !def) continue
      views.push({
        id,
        title: def.title,
        description: def.description,
        source: def.sourceType,
        sourceLabel: runtime.sourceLabel,
        confidence: def.confidence,
        day: runtime.discoveredDay,
        read: runtime.read,
        tags: def.tags,
        affectedNames: def.affectedNodeIds
          .map((nodeId) => index.node.get(nodeId)?.name)
          .filter((name): name is string => Boolean(name)),
        linkedHypothesisIds: runtime.linkedHypothesisIds,
      })
  }
  return views
}

export interface DiscoveredNodeView {
  id: string
  name: string
  type: string
  description: string
  criticality: string
  confidence: number
  /** True when the player established this themselves rather than inheriting it. */
  verified: boolean
  dependencies: { id: string; name: string; type: string; relationship: string; confidence: number }[]
  dependents: { id: string; name: string; relationship: string }[]
  controls: { id: string; name: string; band: string }[]
  serviceHealth?: number
  onKnownAttackPath: boolean
}

export function discoveredNodes(state: GameState, index: ContentIndex): DiscoveredNodeView[] {
  const pathNodeIds = new Set<string>()
  for (const scenario of Object.values(state.risks.scenarios)) {
    // Only scenarios the player has actually worked up reveal their attack
    // paths. An inherited "emerging" entry is a hint, not an understanding.
    if (scenario.status === 'closed' || scenario.status === 'emerging') continue
    const def = index.riskScenario.get(scenario.id)
    for (const pathId of def?.attackPathIds ?? []) {
      for (const step of index.attackPath.get(pathId)?.steps ?? []) pathNodeIds.add(step.nodeId)
    }
  }

  const out: DiscoveredNodeView[] = []
  for (const def of index.content.nodes) {
    const runtime = state.organisation.nodes[def.id]
    if (!runtime?.exists || !runtime.discovered) continue

    const dependencies = (index.outgoing.get(def.id) ?? [])
      .filter((edge) => state.organisation.edges[edge.id]?.exists && state.organisation.edges[edge.id]?.discovered)
      .map((edge) => ({
        id: edge.to,
        name: index.node.get(edge.to)?.name ?? edge.to,
        type: index.node.get(edge.to)?.type ?? 'application',
        relationship: edge.type.replace(/_/g, ' '),
        confidence: state.organisation.edges[edge.id]?.discoveryConfidence ?? 0,
      }))
    const dependents = (index.incoming.get(def.id) ?? [])
      .filter((edge) => state.organisation.edges[edge.id]?.exists && state.organisation.edges[edge.id]?.discovered)
      .map((edge) => ({
        id: edge.from,
        name: index.node.get(edge.from)?.name ?? edge.from,
        relationship: edge.type.replace(/_/g, ' '),
      }))
    const controls = index.content.controls
      .filter((control) => control.targetNodeIds.includes(def.id))
      .map((control) => {
        const runtimeControl = state.controls.controls[control.id]
        // The player sees what they believe, not the hidden truth.
        const believed = runtimeControl?.believed
        const value = believed
          ? calculateControlEffectiveness({ ...runtimeControl!, ...believed })
          : 0
        return { id: control.id, name: control.shortName, band: controlBand(value) }
      })
    const service = index.content.services.find((s) => s.nodeId === def.id)

    out.push({
      id: def.id,
      name: def.name,
      type: def.type,
      description: def.description,
      criticality: def.criticality,
      confidence: runtime.discoveryConfidence,
      verified: runtime.verified ?? false,
      dependencies,
      dependents,
      controls,
      serviceHealth: service ? state.business.serviceHealth[def.id] : undefined,
      onKnownAttackPath: pathNodeIds.has(def.id),
    })
  }
  return out
}

export function undiscoveredCount(state: GameState): { nodes: number; edges: number } {
  let nodes = 0
  let edges = 0
  for (const node of Object.values(state.organisation.nodes)) if (node.exists && !node.discovered) nodes += 1
  for (const edge of Object.values(state.organisation.edges)) if (edge.exists && !edge.discovered) edges += 1
  return { nodes, edges }
}

export interface ProgrammeView {
  id: string
  name: string
  shortName: string
  description: string
  rationale: string
  status: string
  progressPercent: number
  budgetCost: number
  budgetAllocated: number
  sponsorName?: string
  staffingLabel: string
  confidenceLabel: string
  blockers: { id: string; name: string; description: string; resolution: string; budget?: number; focus?: number }[]
  milestones: { id: string; name: string; description: string; complete: boolean }[]
  controlImpact: string[]
  capacityDemand: { fn: string; days: number }[]
  durationDays: number
}

export function programmeViews(state: GameState, index: ContentIndex): ProgrammeView[] {
  return index.content.programmes.map((def) => {
    const runtime = state.programmes.programmes[def.id]!
    const activeBlockers = runtime.blockers.filter((blocker) => !blocker.resolved)
    return {
      id: def.id,
      name: def.name,
      shortName: def.shortName,
      description: def.description,
      rationale: def.rationale,
      status: runtime.status,
      progressPercent: Math.round(runtime.progress * 100),
      budgetCost: def.budgetCost,
      budgetAllocated: runtime.budgetAllocated,
      sponsorName: runtime.sponsorId ? index.stakeholder.get(runtime.sponsorId)?.name : undefined,
      staffingLabel:
        runtime.status === 'proposed'
          ? 'Not started'
          : runtime.staffing > 0.85
            ? 'Fully staffed'
            : runtime.staffing > 0.5
              ? 'Partly staffed'
              : 'Starved of people',
      confidenceLabel: deliveryConfidenceLabel(deliveryConfidence(runtime, index, state.currentDay)),
      blockers: activeBlockers.map((blocker) => {
        const blockerDef = def.blockers.find((b) => b.id === blocker.id)
        return {
          id: blocker.id,
          name: blockerDef?.name ?? blocker.id,
          description: blockerDef?.description ?? '',
          resolution: blockerDef?.resolution.label ?? 'Resolve',
          budget: blockerDef?.resolution.budget,
          focus: blockerDef?.resolution.focus,
        }
      }),
      milestones: def.milestones.map((milestone) => ({
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        complete: runtime.completedMilestoneIds.includes(milestone.id),
      })),
      controlImpact: Array.from(
        new Set(
          def.milestones.flatMap((milestone) =>
            milestone.controlEffects.map((effect) => index.control.get(effect.controlId)?.shortName ?? effect.controlId),
          ),
        ),
      ),
      capacityDemand: Object.entries(def.capacityDemand).map(([fn, days]) => ({ fn, days: days ?? 0 })),
      durationDays: def.durationDays,
    }
  })
}

export interface TeamView {
  functions: {
    fn: string
    label: string
    capacity: number
    committed: number
    band: string
    moraleLabel: string
    vacancies: number
    hiring: boolean
  }[]
  leaders: {
    id: string
    name: string
    role: string
    strengths: string[]
    weaknesses: string[]
    workloadLabel: string
    moraleLabel: string
    reliabilityLabel: string
    running: number
    completed: number
    late: number
  }[]
  assignments: (AssignmentState & { leaderName: string; daysRemaining: number })[]
  strainBand: string
  /** The worst function's morale in words, when it is below holding up. */
  healthNote?: string
}

const FUNCTION_LABELS: Record<string, string> = {
  soc: 'SOC and detection',
  engineering: 'Security engineering',
  architecture: 'Security architecture',
  grc: 'Cyber risk and governance',
  iam: 'Identity and access',
  'incident-response': 'Incident response',
}

export function teamView(state: GameState, index: ContentIndex): TeamView {
  return {
    functions: CYBER_FUNCTIONS.map((fn) => {
      const runtime = state.team.functions[fn]!
      return {
        fn,
        label: FUNCTION_LABELS[fn] ?? fn,
        capacity: runtime.capacity,
        committed: Math.round(runtime.committed * 10) / 10,
        band: capacityBand(functionStrain(state, fn)),
        moraleLabel:
          runtime.morale < 0.25
            ? 'Burning out'
            : runtime.morale < 0.45
              ? 'Strained'
              : runtime.morale < 0.65
                ? 'Holding up'
                : runtime.morale < 0.85
                  ? 'Steady'
                  : 'Energised',
        vacancies: runtime.vacancies,
        hiring: (runtime.hiringDaysRemaining ?? 0) > 0,
      }
    }),
    leaders: index.content.leaders.map((def) => {
      const runtime = state.team.leaders[def.id]!
      const running = state.team.assignments.filter((a) => a.leaderId === def.id && a.status === 'running').length
      return {
        id: def.id,
        name: def.name,
        role: def.role,
        strengths: def.strengths,
        weaknesses: def.weaknesses,
        workloadLabel: runtime.workload > 0.8 ? 'Overloaded' : runtime.workload > 0.55 ? 'Busy' : 'Has room',
        moraleLabel: runtime.morale > 0.7 ? 'Engaged' : runtime.morale > 0.45 ? 'Steady' : 'Struggling',
        reliabilityLabel: runtime.reliability > 0.75 ? 'Dependable' : runtime.reliability > 0.55 ? 'Usually reliable' : 'Unpredictable',
        running,
        completed: runtime.assignmentsCompleted,
        late: runtime.assignmentsLate,
      }
    }),
    assignments: state.team.assignments
      .filter((assignment) => assignment.status === 'running')
      .map((assignment) => ({
        ...assignment,
        leaderName: index.leader.get(assignment.leaderId)?.name ?? assignment.leaderId,
        daysRemaining: assignment.dueDay - state.currentDay,
      })),
    strainBand: capacityBand(teamStrain(state)),
    healthNote: teamHealthNote(state),
  }
}

export interface BriefingView {
  dateLabel: string
  weekLabel: string
  quarter: number
  budgetRemaining: number
  budgetTotal: number
  focusRemaining: number
  focusPerWeek: number
  boardConfidence: string
  teamCapacity: string
  residualExposure: RiskBand
  recoveryConfidence: string
  openDecisions: number
  unreadMessages: number
  invalidatedAssumptions: number
  reviewsDue: number
  activeIncident?: { id: string; name: string; phase: string; servicesAffected: string[] }
  runningWork: number
  /**
   * The function whose morale is lowest, in words, when it is below holding
   * up. Capacity says what the team can carry this week; this says what it
   * is costing them. A playtest read available capacity as recovered health
   * and met "burning out" for the first time in the annual review.
   */
  teamHealthNote?: string
  understandingPercent: number
  /** How much of what the player could have checked themselves, they have. */
  examinedShare: number
}

/** The function whose morale is lowest, in words, when it is below holding up. */
function teamHealthNote(state: GameState): string | undefined {
  const worst = CYBER_FUNCTIONS.map((fn) => ({ fn, morale: state.team.functions[fn]?.morale ?? 1 })).sort((a, b) => a.morale - b.morale)[0]
  if (!worst || worst.morale >= 0.45) return undefined
  return `${functionTitle(worst.fn)} ${moraleLabel(worst.morale).toLowerCase()}`
}

export function briefing(state: GameState, index: ContentIndex): BriefingView {
  const date = formatGameDate(state.currentDay)
  const residualValues = Object.values(state.risks.scenarios)
    .map((scenario) => scenario.lastAssessed?.residual)
    .filter((value): value is number => typeof value === 'number')
  const residual = residualValues.length
    ? residualValues.reduce((sum, value) => sum + value, 0) / residualValues.length
    : 0

  const backup = state.controls.controls['ctl-backup']
  const backupBelief = backup?.believed
  const recovery = backup && backupBelief ? calculateControlEffectiveness({ ...backup, ...backupBelief }) : 0

  const active = Object.values(state.incidents.incidents).find((incident) => incident.phase !== 'closed')

  return {
    dateLabel: date.label,
    weekLabel: date.weekLabel,
    quarter: currentQuarter(state.currentDay),
    budgetRemaining: Math.round(state.resources.budgetRemaining),
    budgetTotal: state.resources.budgetTotal,
    focusRemaining: state.resources.focusRemaining,
    focusPerWeek: state.resources.focusPerWeek,
    boardConfidence: boardConfidenceLabel(state.stakeholders.boardConfidence),
    teamCapacity: capacityBand(teamStrain(state)),
    residualExposure: riskBand(residual),
    recoveryConfidence: recovery < 0.3 ? 'Limited' : recovery < 0.55 ? 'Partial' : recovery < 0.78 ? 'Reasonable' : 'Strong',
    openDecisions: state.decisions.openIds.length,
    unreadMessages: state.inbox.messages.filter((message) => !message.read).length,
    invalidatedAssumptions: Object.values(state.assumptions.assumptions).filter((a) => a.status === 'invalidated' && !a.acknowledged).length,
    reviewsDue: Object.values(state.risks.scenarios).filter(
      (scenario) => scenario.status !== 'closed' && state.currentDay >= scenario.nextReviewDay,
    ).length,
    activeIncident: active
      ? {
          id: active.id,
          name: index.incidentFamily.get(active.familyId)?.name ?? 'Incident',
          phase: active.phase,
          servicesAffected: active.affectedServiceIds
            .map((serviceId) => index.service.get(serviceId)?.name)
            .filter((name): name is string => Boolean(name)),
        }
      : undefined,
    runningWork: state.team.assignments.filter((assignment) => assignment.status === 'running').length,
    teamHealthNote: teamHealthNote(state),
    understandingPercent: Math.round(clamp01(state.organisation.understanding['overall'] ?? 0) * 100),
    examinedShare: (() => {
      const examined = unexaminedMaterial(state, index)
      return examined.reachable > 0 ? examined.examined / examined.reachable : 0
    })(),
  }
}

export function stakeholderViews(state: GameState, index: ContentIndex) {
  return index.content.stakeholders.map((def) => {
    const runtime = state.stakeholders.stakeholders[def.id]!
    return {
      id: def.id,
      name: def.name,
      role: def.role,
      shortRole: def.shortRole,
      priorities: def.priorities,
      voice: def.voice,
      band: relationshipBand(runtime.trust),
      understanding:
        runtime.cyberUnderstanding > 0.66 ? 'Fluent' : runtime.cyberUnderstanding > 0.4 ? 'Developing' : 'Limited',
      appetite: runtime.riskTolerance > 0.6 ? 'Tolerant' : runtime.riskTolerance > 0.4 ? 'Balanced' : 'Cautious',
      concerns: runtime.concerns,
      memory: runtime.memory.slice(0, 4),
    }
  })
}

export function inboxView(state: GameState): InboxMessage[] {
  return state.inbox.messages
}

export function assumptionViews(state: GameState) {
  return Object.values(state.assumptions.assumptions)
    .slice()
    .sort((a, b) => {
      const rank = (status: string) => (status === 'invalidated' ? 0 : status === 'uncertain' ? 1 : 2)
      return rank(a.status) - rank(b.status) || b.createdDay - a.createdDay
    })
}

export function incidentViews(state: GameState, index: ContentIndex) {
  return state.incidents.order
    .map((id) => {
      const incident = state.incidents.incidents[id]
      if (!incident) return undefined
      const family = index.incidentFamily.get(incident.familyId)
      return {
        id,
        name: family?.name ?? 'Incident',
        headline: family?.headline ?? '',
        phase: incident.phase,
        startedDay: incident.startedDay,
        resolvedDay: incident.resolvedDay,
        servicesAffected: incident.affectedServiceIds
          .map((serviceId) => index.service.get(serviceId)?.name)
          .filter((name): name is string => Boolean(name)),
        reconstruction: incident.reconstruction,
        severity: riskBand(incident.consequence),
      }
    })
    .filter((view): view is NonNullable<typeof view> => Boolean(view))
}

export interface IncidentCommandView {
  id: string
  name: string
  phase: string
  phaseLabel: string
  startedDay: number
  detectedDay?: number
  daysRunning: number
  /** Words, never the internal number: how far containment and recovery got. */
  containmentLabel: string
  recoveryLabel: string
  servicesAffected: string[]
  /** What the player has been told, in the order they were told it. */
  timeline: { day: number; text: string }[]
  /** Response choices waiting on the CISO right now. */
  awaiting: { decisionId: string; title: string }[]
  /** Choices already made in this incident, so the record is visible while it runs. */
  taken: { day: number; title: string; option: string }[]
}

/**
 * The live incident, assembled for a command view rather than a status line.
 *
 * Built only from what the player has been told — the incident messages in
 * their inbox and the choices they have made — rather than from the simulation's
 * own knowledge of the path. Reading the attack path here would put the hidden
 * graph on screen, which is the one thing the UI may never do.
 */
export function incidentCommand(state: GameState, index: ContentIndex): IncidentCommandView | undefined {
  const incident = Object.values(state.incidents.incidents).find((candidate) => candidate.phase !== 'closed')
  if (!incident) return undefined
  const family = index.incidentFamily.get(incident.familyId)

  const timeline = state.inbox.messages
    .filter((message) => message.type === 'incident' && message.day >= incident.startedDay)
    .map((message) => ({ day: message.day, text: message.body || message.subject }))
    .sort((a, b) => a.day - b.day)

  const awaiting: IncidentCommandView['awaiting'] = []
  for (const decisionId of state.decisions.openIds) {
    const runtime = state.decisions.decisions[decisionId]
    const def = runtime ? index.decision.get(runtime.defId) : undefined
    if (!def || !def.id.startsWith('dec-inc-')) continue
    awaiting.push({ decisionId, title: def.title })
  }

  const taken: IncidentCommandView['taken'] = []
  for (const entry of incident.decisionsTaken) {
    const runtime = state.decisions.decisions[entry.decisionId]
    const def = runtime ? index.decision.get(runtime.defId) : undefined
    const option = def?.options.find((candidate) => candidate.id === entry.optionId)
    if (def) taken.push({ day: entry.day, title: def.title, option: option?.label ?? entry.optionId })
  }

  const progressLabel = (value: number, done: string, most: string, some: string, none: string): string =>
    value >= 0.95 ? done : value >= 0.6 ? most : value >= 0.25 ? some : none

  return {
    id: incident.id,
    name: family?.name ?? 'Incident',
    phase: incident.phase,
    phaseLabel: statusLabel(incident.phase),
    startedDay: incident.startedDay,
    detectedDay: incident.detectionDay,
    daysRunning: state.currentDay - incident.startedDay,
    containmentLabel: progressLabel(
      incident.containment,
      'Contained',
      'Mostly contained',
      'Partly contained',
      'Not yet contained',
    ),
    // "Not yet recovering" sat on the same line as a phase of "Recovery" and a
    // timeline entry saying restoration had begun, because recovery was 0.18
    // and the bottom word did not know the phase. Once the phase is recovery,
    // it has started, however little of it there is to show.
    recoveryLabel: progressLabel(
      incident.recovery,
      'Recovered',
      'Mostly recovered',
      'Recovering',
      incident.phase === 'recovery' ? 'Recovery just starting' : 'Not yet recovering',
    ),
    servicesAffected: incident.affectedServiceIds
      .map((serviceId) => index.service.get(serviceId)?.name)
      .filter((name): name is string => Boolean(name)),
    timeline,
    awaiting,
    taken: taken.sort((a, b) => a.day - b.day),
  }
}

export interface CollisionView {
  objectiveId: string
  objectiveName: string
  ownerName?: string
  daysUntilTarget: number
  /** The programme that would cover this objective's dependencies, if any. */
  programmeId?: string
  programmeName?: string
  milestoneName?: string
  /** Where the cover lands relative to the business date, in plain words. */
  verdict: 'covered' | 'close' | 'too-late' | 'not-started' | 'nothing-relevant'
  /**
   * Days to the next covering milestone, extrapolated from the rate the
   * programme has actually managed so far.
   *
   * Deliberately not presented as a date. The business date is a commitment and
   * can be stated; this is a projection off a rate that changes with staffing,
   * blockers and whatever else the player does next, so the interface draws it
   * as a band rather than a point. Absent when nothing is running to project
   * from.
   */
  daysToMilestone?: number
  /** Risks the player has already raised on the same dependencies. */
  exposedRisks: { id: string; title: string }[]
}

/**
 * Where the business clock, the programme clock and the threat picture meet
 * (plan §13). All three were simulated and shown separately, so the player had
 * to hold them in their head to notice that the control which would cover a
 * launch is not going to arrive until after it.
 *
 * Everything here is derived from what the player can already see: the
 * objective's own date, the progress their programme has actually made, and
 * risks they have raised themselves.
 */
export function collisions(state: GameState, index: ContentIndex, horizonDays = 120): CollisionView[] {
  const out: CollisionView[] = []

  for (const def of index.content.objectives) {
    const runtime = state.business.objectives[def.id]
    if (!runtime || runtime.status === 'achieved' || runtime.status === 'failed') continue
    const targetDay = runtime.targetDay + runtime.delayDays
    const daysUntilTarget = targetDay - state.currentDay
    if (daysUntilTarget < 0 || daysUntilTarget > horizonDays) continue

    // What the objective rests on, plus what those things rest on in turn —
    // but only through dependencies the player has actually discovered. The
    // collision becomes visible as they map the organisation, which is the
    // right way round: you cannot see it coming if you never looked.
    const dependencies = new Set(def.dependencyNodeIds)
    for (const edgeDef of index.content.edges) {
      const edge = state.organisation.edges[edgeDef.id]
      if (!edge?.exists || !edge.discovered) continue
      if (dependencies.has(edgeDef.from)) dependencies.add(edgeDef.to)
      if (dependencies.has(edgeDef.to)) dependencies.add(edgeDef.from)
    }

    // Controls that actually sit on what this objective depends on.
    const relevantControls = new Set(
      index.content.controls
        .filter((control) => control.targetNodeIds.some((nodeId) => dependencies.has(nodeId)))
        .map((control) => control.id),
    )

    let best:
      | { programmeId: string; programmeName: string; milestoneName: string; verdict: CollisionView['verdict']; daysToMilestone?: number }
      | undefined

    for (const programme of index.content.programmes) {
      const covers = programme.milestones.some((milestone) =>
        milestone.controlEffects.some((effect) => relevantControls.has(effect.controlId)),
      )
      if (!covers) continue
      const programmeRuntime = state.programmes.programmes[programme.id]
      if (!programmeRuntime) continue

      const next = programme.milestones.find(
        (milestone) =>
          !programmeRuntime.completedMilestoneIds.includes(milestone.id) &&
          milestone.controlEffects.some((effect) => relevantControls.has(effect.controlId)),
      )
      if (!next) {
        best = {
          programmeId: programme.id,
          programmeName: programme.name,
          milestoneName: 'already delivered',
          verdict: 'covered',
        }
        break
      }
      if (programmeRuntime.status === 'proposed') {
        if (!best) {
          best = {
            programmeId: programme.id,
            programmeName: programme.name,
            milestoneName: next.name,
            verdict: 'not-started',
          }
        }
        continue
      }

      // Rate the programme has actually managed, not the rate it was sold at.
      const daysRunning = Math.max(1, state.currentDay - (programmeRuntime.startedDay ?? state.currentDay))
      const rate = programmeRuntime.progress / daysRunning
      const remaining = next.atProgress - programmeRuntime.progress
      const daysToMilestone = rate > 0 ? remaining / rate : Number.POSITIVE_INFINITY
      const verdict: CollisionView['verdict'] =
        daysToMilestone <= daysUntilTarget
          ? 'covered'
          : daysToMilestone <= daysUntilTarget * 1.3
            ? 'close'
            : 'too-late'
      const rank = { covered: 0, close: 1, 'too-late': 2, 'not-started': 3, 'nothing-relevant': 4 }
      if (!best || rank[verdict] < rank[best.verdict]) {
        best = {
          programmeId: programme.id,
          programmeName: programme.name,
          milestoneName: next.name,
          verdict,
          daysToMilestone: Number.isFinite(daysToMilestone) ? Math.round(daysToMilestone) : undefined,
        }
      }
    }

    const exposedRisks = Object.values(state.risks.scenarios)
      .filter((scenario) => scenario.status === 'open' || scenario.status === 'accepted')
      .map((scenario) => index.riskScenario.get(scenario.id))
      .filter((scenarioDef): scenarioDef is NonNullable<typeof scenarioDef> => Boolean(scenarioDef))
      .filter((scenarioDef) => scenarioDef.triggerNodeIds.some((nodeId) => dependencies.has(nodeId)))
      .map((scenarioDef) => ({ id: scenarioDef.id, title: scenarioDef.title }))

    // An objective nothing you could run would help is not a collision, it is
    // just a date. Saying so daily would teach the player to stop reading this.
    if (!best) continue

    out.push({
      objectiveId: def.id,
      objectiveName: def.name,
      ownerName: index.stakeholder.get(def.ownerStakeholderId)?.name,
      daysUntilTarget,
      programmeId: best?.programmeId,
      programmeName: best?.programmeName,
      milestoneName: best?.milestoneName,
      verdict: best?.verdict ?? 'nothing-relevant',
      daysToMilestone: best?.daysToMilestone,
      exposedRisks,
    })
  }

  // Soonest first: the collision that matters is the one arriving next.
  return out.sort((a, b) => a.daysUntilTarget - b.daysUntilTarget)
}

export interface PatternSuggestion {
  templateId: string
  title: string
  statement: string
  /** The evidence the player already holds that suggests it. */
  evidence: { id: string; title: string }[]
  /** When the most recent piece of that evidence arrived. */
  newestEvidenceDay: number
}

/**
 * Patterns the evidence in hand would support, offered rather than hunted for.
 *
 * The mechanic was sound and the interaction was not: forming a hypothesis
 * meant opening a dialog, reading a list of templates and matching them against
 * evidence by memory, which turns the most interesting moment in the game — the
 * moment something clicks — into filing. The game now says what it noticed and
 * names the evidence behind it. The judgement stays with the player: forming
 * one still costs attention, and dismissing one is a real answer.
 *
 * A pattern is offered when it has just become visible, not for as long as it
 * remains true. Offering every supported template every day put fourteen of
 * them on screen at once on 95% of days, which is a backlog rather than an
 * insight; tying the offer to the arrival of the evidence makes it a moment,
 * and one the player can miss.
 */
/**
 * A "contradicts-x" tag says what the evidence argues against, so the rule can
 * hold by construction rather than by an author remembering to repeat it.
 *
 * Listing it in each template's contradictingTags closed one case and left the
 * others open: only 2 of 14 templates name any, so the clean supplier
 * questionnaire was still cited under "what suggests it" by hyp-logistics, and
 * the claim that legacy is isolated by hyp-detection-gap — 817 offer-days
 * across 20 of 20 campaigns.
 */
function argues(tag: string, supportingTags: string[]): boolean {
  if (!tag.startsWith('contradicts-')) return false
  return supportingTags.includes(tag.slice('contradicts-'.length))
}

/**
 * How much a piece of evidence actually speaks to a proposition: the number
 * of the template's supporting tags it carries, plus one if it carries the
 * tag the template is about. One shared tag is a passing mention — "backup
 * shares administrative credentials" is tagged `privileged`, and `privileged`
 * supports five templates, so it was cited for the deployment pipeline and
 * for a supplier integration, which it says nothing about.
 */
function evidenceFit(def: EvidenceDef, template: HypothesisTemplateDef): number {
  const shared = def.tags.filter((tag) => template.supportingTags.includes(tag)).length
  return shared + (def.tags.some((tag) => template.requiresTags.includes(tag)) ? 1 : 0)
}

export function patternSuggestions(state: GameState, index: ContentIndex, freshDays = 12): PatternSuggestion[] {
  const dismissed = new Set(state.risks.dismissedPatternIds ?? [])
  const known = state.evidence.order
    .map((id) => index.evidence.get(id))
    .filter((def): def is NonNullable<typeof def> => Boolean(def))
  const knownTags = new Set(known.flatMap((def) => def.tags))
  const formed = new Set(Object.values(state.risks.hypotheses).map((hypothesis) => hypothesis.templateId))

  const out: PatternSuggestion[] = []
  for (const template of index.content.hypothesisTemplates) {
    if (dismissed.has(template.id) || formed.has(template.id)) continue
    if (!template.requiresTags.every((tag) => knownTags.has(tag))) continue
    // Only worth raising once the player holds something that actually speaks
    // to it; the required tag alone can be a single passing mention.
    // A piece can carry both a supporting and a contradicting tag — the clean
    // supplier questionnaire is tagged "supplier" and "contradicts-supplier",
    // because it is about suppliers and argues the other way. Matching on the
    // supporting tag alone listed "Supplier assurance questionnaire returned
    // clean" under "what suggests it", which cites reassurance as grounds for
    // alarm. What argues against a proposition is not evidence for it.
    // Evidence the content marks as noise is a red herring by design — the
    // printer alerts read "Benign. Worth fixing, not worth a programme." —
    // and counting it made the game offer "a material intrusion could
    // progress unnoticed" on the strength of a misconfigured print server.
    // Discriminating signal from noise is what the player is here to learn;
    // the game cannot do it for them and then get it wrong itself.
    const supporting = known.filter(
      (def) =>
        def.noise !== true &&
        def.tags.some((tag) => template.supportingTags.includes(tag)) &&
        !def.tags.some((tag) => template.contradictingTags.includes(tag)) &&
        !def.tags.some((tag) => argues(tag, template.supportingTags)),
    )
    if (supporting.length < 2) continue
    // Something in hand has to speak to the proposition itself, not merely
    // share a word with it. Measured over 20 campaigns per play style: this
    // costs 1.5% of offers and no template its reach, and it is what stopped
    // "the deployment pipeline is a privileged path" being offered on four
    // pieces none of which mention the pipeline.
    if (!supporting.some((def) => evidenceFit(def, template) >= 2)) continue

    const newestDay = supporting.reduce(
      (latest, def) => Math.max(latest, state.evidence.items[def.id]?.discoveredDay ?? 0),
      0,
    )
    if (state.currentDay - newestDay > freshDays) continue

    out.push({
      templateId: template.id,
      title: template.title,
      statement: template.statement,
      newestEvidenceDay: newestDay,
      evidence: supporting
        // Best fit first, then newest. Four propositions once listed the same
        // four pieces in the same order, because the list was ordered by
        // arrival and the newest piece was a generic one. What led here should
        // lead with what is actually about the proposition; the freshness gate
        // above already guarantees something recent is in the list.
        .slice()
        .sort(
          (a, b) =>
            evidenceFit(b, template) - evidenceFit(a, template) ||
            (state.evidence.items[b.id]?.discoveredDay ?? 0) - (state.evidence.items[a.id]?.discoveredDay ?? 0),
        )
        .slice(0, 4)
        .map((def) => ({ id: def.id, title: def.title })),
    })
  }
  // Freshest first, so what the player is shown is what just clicked.
  return out.sort((a, b) => b.newestEvidenceDay - a.newestEvidenceDay)
}

/* ------------------------------------------------------- the year timeline -- */

export interface TimelineMark {
  day: number
  /** What it was, in the words the player already saw. */
  label: string
  /** Absent means the thing did not happen — a decision taken by default. */
  present: boolean
}

export interface TimelineSpan {
  fromDay: number
  toDay: number
  label: string
  complete: boolean
}

export interface TimelineLane {
  id: string
  label: string
  /** The count, read as a sentence rather than printed as a score. */
  summary: string
  icon: IconName
  /** A CSS custom property name, so light and dark are the same code path. */
  tone: string
  marks: TimelineMark[]
  spans: TimelineSpan[]
}

/**
 * A whole campaign as six lanes across 364 days (plan §26).
 *
 * Derived entirely from what the player already saw: their own decisions, the
 * work they commissioned, the papers they wrote, and what arrived anyway. It
 * reads no hidden state, so nothing here can leak the graph the simulation
 * reasons about — the attack path behind an incident is not in it, only the
 * day the incident reached the business.
 *
 * Identity is carried by the lane a mark sits in and by the icon on that lane's
 * label, never by its colour: six rows, six labels, six icons. Colour is the
 * second channel, which is what lets the whole figure survive being printed or
 * read by somebody who cannot separate the hues.
 */
export function yearTimeline(state: GameState, index: ContentIndex): TimelineLane[] {
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

  const decisions = Object.values(state.decisions.decisions).filter((d) => d.resolvedDay !== undefined)
  const taken = decisions.filter((d) => !d.resolvedByDefault)
  const lapsed = decisions.filter((d) => d.resolvedByDefault)
  const decisionMarks: TimelineMark[] = decisions.map((d) => ({
    day: d.resolvedDay ?? 0,
    label: index.decision.get(d.defId)?.title ?? 'A decision',
    present: !d.resolvedByDefault,
  }))

  const spans: TimelineSpan[] = []
  for (const runtime of Object.values(state.programmes.programmes)) {
    if (runtime.startedDay === undefined) continue
    const def = index.programme.get(runtime.id)
    spans.push({
      fromDay: runtime.startedDay,
      toDay: runtime.completedDay ?? state.currentDay,
      label: def?.shortName ?? runtime.id,
      complete: runtime.status === 'complete',
    })
  }
  const completed = spans.filter((s) => s.complete).length

  const enquiries = state.team.assignments.filter((a) => a.kind === 'investigation')
  const incidents = Object.values(state.incidents.incidents)
  const failedAssumptions = Object.values(state.assumptions.assumptions).filter(
    (a) => a.status === 'invalidated' && a.invalidatedDay !== undefined,
  )

  return [
    {
      id: 'decisions',
      label: 'Decisions',
      summary:
        lapsed.length === 0
          ? `${plural(taken.length, 'decision', 'decisions')}, all your own`
          : `${plural(taken.length, 'taken', 'taken')}, ${lapsed.length} decided for you`,
      icon: 'decision',
      tone: '--ink',
      marks: decisionMarks,
      spans: [],
    },
    {
      id: 'programmes',
      label: 'Programmes',
      summary:
        spans.length === 0
          ? 'none started'
          : `${plural(spans.length, 'started', 'started')}, ${completed} finished`,
      icon: 'programme',
      tone: '--chart-programme',
      marks: [],
      spans,
    },
    {
      id: 'enquiries',
      label: 'Enquiries',
      summary: enquiries.length === 0 ? 'none commissioned' : plural(enquiries.length, 'commissioned', 'commissioned'),
      icon: 'enquiry',
      tone: '--chart-enquiry',
      marks: enquiries.map((a) => ({ day: a.startedDay, label: a.title, present: true })),
      spans: [],
    },
    {
      id: 'board',
      label: 'Board papers',
      summary: `${state.reviews.quarters.length} of 3 prepared`,
      icon: 'board',
      tone: '--chart-board',
      marks: state.reviews.quarters.map((q) => ({ day: q.day, label: `Q${q.quarter} board paper`, present: true })),
      spans: [],
    },
    {
      id: 'assumptions',
      label: 'Assumptions',
      summary:
        failedAssumptions.length === 0
          ? 'none stopped holding'
          : `${plural(failedAssumptions.length, 'stopped', 'stopped')} holding`,
      icon: 'assumption',
      tone: '--band-high',
      marks: failedAssumptions.map((a) => ({ day: a.invalidatedDay ?? 0, label: a.statement, present: true })),
      spans: [],
    },
    {
      id: 'incidents',
      label: 'Incidents',
      summary:
        incidents.length === 0
          ? 'none reached the business'
          : `${plural(incidents.length, 'reached', 'reached')} the business`,
      icon: 'incident',
      tone: '--band-severe',
      marks: incidents.map((i) => ({
        day: i.startedDay,
        label: index.incidentFamily.get(i.familyId)?.name ?? 'Incident',
        present: true,
      })),
      spans: [],
    },
  ]
}

export interface CameBackItem {
  id: string
  day: number
  from: string
  subject: string
  kind: 'result' | 'consequence' | 'lapse' | 'acceptance' | 'stopped' | 'incident'
}

/**
 * What the player's own actions sent back, unread: an enquiry that
 * returned, a callback to a choice, a decision the organisation took for
 * them, an acceptance that ran out, work that was pulled back. The first
 * observed playtest followed the briefing and Skip ahead and missed all of
 * these for weeks, because every one lived in an inbox it was not reading.
 * The briefing shows what needs an answer; this is what its answers did.
 */
export function cameBack(state: GameState, index: ContentIndex, limit = 4): CameBackItem[] {
  const out: CameBackItem[] = []
  for (const message of state.inbox.messages) {
    if (message.read) continue
    const tags = message.eventId ? (index.event.get(message.eventId)?.tags ?? []) : []
    let kind: CameBackItem['kind'] | undefined
    if (message.subject.startsWith('Completed: ')) kind = 'result'
    else if (message.subject.startsWith('Decided without you: ')) kind = 'lapse'
    else if (message.subject.startsWith('Your acceptance of ')) kind = 'acceptance'
    else if (message.subject.startsWith('Pulled back: ') || message.subject.startsWith('Paused: ')) kind = 'stopped'
    else if (tags.includes('consequence')) kind = 'consequence'
    // Skip ahead can carry a player from containment to closure in one
    // click, leaving the consequence, recovery and debrief in the inbox.
    else if (message.type === 'incident') kind = 'incident'
    if (!kind) continue
    out.push({ id: message.id, day: message.day, from: message.from, subject: message.subject, kind })
  }
  // Inbox messages are prepended, so this is already newest first.
  return out.slice(0, limit)
}

/**
 * The risks on the player's own list that an enquiry would speak to: those
 * whose trigger nodes it would reveal, or whose attack paths run through a
 * control it would assess. Only risks the player has, never the catalogue —
 * naming a scenario they have not met would hand them the hidden truth.
 * The opening playtest's newcomers could not connect a risk card to an
 * enquiry; this is the connection, on the card.
 */
export function enquirySpeaksTo(state: GameState, index: ContentIndex, investigationId: string): { id: string; title: string }[] {
  const def = index.investigation.get(investigationId)
  if (!def) return []
  const nodeIds = new Set(def.revealsNodeIds)
  const controlIds = new Set(def.assessesControlIds)
  // In the order the player's own list ranks them, so a card that names a
  // few of many names the ones that matter most.
  const out: { id: string; title: string }[] = []
  for (const risk of visibleRisks(state, index)) {
    if (risk.status === 'closed') continue
    const scenario = index.riskScenario.get(risk.id)
    if (!scenario) continue
    const byNode = scenario.triggerNodeIds.some((id) => nodeIds.has(id))
    const byControl = scenario.attackPathIds.some((pathId) =>
      index.attackPath.get(pathId)?.steps.some((step) => step.controlIds.some((id) => controlIds.has(id))),
    )
    if (byNode || byControl) out.push({ id: scenario.id, title: scenario.title })
  }
  return out
}
