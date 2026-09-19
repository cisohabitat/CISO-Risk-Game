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
  GameState,
  InboxMessage,
  RiskBand,
} from '@/game/types'
import { CYBER_FUNCTIONS, DAYS_PER_QUARTER, clamp01 } from '@/game/types'
import { riskBand } from '@/game/risk/bands'
import { calculateControlEffectiveness, controlBand } from '@/game/controls/effectiveness'
import { capacityBand, functionStrain, teamStrain } from '@/game/team/capacity'
import { boardConfidenceLabel, relationshipBand } from '@/game/stakeholders/relationships'
import { deliveryConfidence, deliveryConfidenceLabel } from '@/game/programmes/progression'
import { statusLabel } from '@/lib/formatting/labels'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Day 0 is the first Monday of the campaign year. */
export function formatGameDate(day: number): { label: string; month: string; weekLabel: string } {
  const monthIndex = Math.min(11, Math.floor(day / 30.33))
  const dayOfMonth = Math.floor(day - monthIndex * 30.33) + 1
  const month = MONTHS[monthIndex] ?? 'December'
  return {
    label: `${dayOfMonth} ${month}`,
    month,
    weekLabel: `Week ${Math.floor(day / 7) + 1}`,
  }
}

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
    })
  }
  const order: Record<string, number> = { severe: 0, high: 1, elevated: 2, moderate: 3, low: 4 }
  return out.sort((a, b) => (order[a.band] ?? 5) - (order[b.band] ?? 5))
}

export function topConcerns(state: GameState, index: ContentIndex, limit = 3): VisibleRisk[] {
  return visibleRisks(state, index)
    .filter((risk) => risk.status === 'open' || risk.status === 'treated' || risk.status === 'emerging')
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
  daysRemaining?: number
  urgent: boolean
  options: {
    id: string
    label: string
    description: string
    visibleKnownEffects: string[]
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
        description: def.description,
        context: def.context,
        teaches: def.teaches,
        requiresRationale: def.requiresRationale,
        daysRemaining,
        urgent: daysRemaining !== undefined && daysRemaining <= 2,
        options: def.options.map((option) => {
          const requirements = option.requirements
          let blockedReason: string | undefined
          if (requirements?.budget && state.resources.budgetRemaining < requirements.budget) {
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
  understandingPercent: number
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
    understandingPercent: Math.round(clamp01(state.organisation.understanding['overall'] ?? 0) * 100),
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
    recoveryLabel: progressLabel(incident.recovery, 'Recovered', 'Mostly recovered', 'Recovering', 'Not yet recovering'),
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
      | { programmeId: string; programmeName: string; milestoneName: string; verdict: CollisionView['verdict'] }
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
        best = { programmeId: programme.id, programmeName: programme.name, milestoneName: next.name, verdict }
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
      exposedRisks,
    })
  }

  // Soonest first: the collision that matters is the one arriving next.
  return out.sort((a, b) => a.daysUntilTarget - b.daysUntilTarget)
}
