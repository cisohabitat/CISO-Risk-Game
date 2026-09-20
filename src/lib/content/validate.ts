/**
 * Referential and semantic validation of campaign content (plan §41).
 *
 * Zod proves the shapes are right; this file proves the content is coherent:
 * every referenced id exists, nothing is duplicated, no pinned narrative beat is
 * unreachable, and the dependency graph has no forbidden cycles.
 */
import type { CampaignContent, Condition, GameEffect } from '@/game/types'
import { CAMPAIGN_DAYS } from '@/game/types'
import { VALIDATION_RULES } from '@/game/assumptions/validation'

export interface ContentIssue {
  severity: 'error' | 'warning'
  rule: string
  where: string
  detail: string
}

interface Registry {
  node: Set<string>
  edge: Set<string>
  service: Set<string>
  objective: Set<string>
  stakeholder: Set<string>
  leader: Set<string>
  control: Set<string>
  programme: Set<string>
  actor: Set<string>
  attackPath: Set<string>
  incidentFamily: Set<string>
  evidence: Set<string>
  scenario: Set<string>
  investigation: Set<string>
  decision: Set<string>
  event: Set<string>
  rationaleTag: Set<string>
  assumption: Set<string>
  evidenceTag: Set<string>
}

function buildRegistry(content: CampaignContent): Registry {
  const evidenceTag = new Set<string>()
  for (const evidence of content.evidence) for (const tag of evidence.tags) evidenceTag.add(tag)
  return {
    node: new Set(content.nodes.map((n) => n.id)),
    edge: new Set(content.edges.map((e) => e.id)),
    service: new Set(content.services.map((s) => s.id)),
    objective: new Set(content.objectives.map((o) => o.id)),
    stakeholder: new Set(content.stakeholders.map((s) => s.id)),
    leader: new Set(content.leaders.map((l) => l.id)),
    control: new Set(content.controls.map((c) => c.id)),
    programme: new Set(content.programmes.map((p) => p.id)),
    actor: new Set(content.actors.map((a) => a.id)),
    attackPath: new Set(content.attackPaths.map((p) => p.id)),
    incidentFamily: new Set(content.incidentFamilies.map((f) => f.id)),
    evidence: new Set(content.evidence.map((e) => e.id)),
    scenario: new Set(content.riskScenarios.map((s) => s.id)),
    investigation: new Set(content.investigations.map((i) => i.id)),
    decision: new Set(content.decisions.map((d) => d.id)),
    event: new Set(content.events.map((e) => e.id)),
    rationaleTag: new Set(content.rationaleTags.map((r) => r.id)),
    assumption: new Set(content.assumptions.map((a) => a.id)),
    evidenceTag,
  }
}

export function validateCampaignContent(content: CampaignContent): ContentIssue[] {
  const issues: ContentIssue[] = []
  const registry = buildRegistry(content)
  const error = (rule: string, where: string, detail: string) =>
    issues.push({ severity: 'error', rule, where, detail })
  const warn = (rule: string, where: string, detail: string) =>
    issues.push({ severity: 'warning', rule, where, detail })

  // ---- duplicate ids -------------------------------------------------------
  const collections: [string, { id: string }[]][] = [
    ['nodes', content.nodes],
    ['edges', content.edges],
    ['services', content.services],
    ['objectives', content.objectives],
    ['stakeholders', content.stakeholders],
    ['leaders', content.leaders],
    ['controls', content.controls],
    ['programmes', content.programmes],
    ['actors', content.actors],
    ['attackPaths', content.attackPaths],
    ['incidentFamilies', content.incidentFamilies],
    ['evidence', content.evidence],
    ['hypothesisTemplates', content.hypothesisTemplates],
    ['riskScenarios', content.riskScenarios],
    ['investigations', content.investigations],
    ['decisions', content.decisions],
    ['events', content.events],
    ['rationaleTags', content.rationaleTags],
    ['assumptions', content.assumptions],
    ['glossary', content.glossary],
  ]
  for (const [name, items] of collections) {
    const seen = new Set<string>()
    for (const item of items) {
      if (seen.has(item.id)) error('duplicate-id', `${name}/${item.id}`, 'Id used more than once')
      seen.add(item.id)
    }
  }

  // ---- references ----------------------------------------------------------
  const ref = (set: Set<string>, value: string, rule: string, where: string) => {
    if (!set.has(value)) error(rule, where, `Unknown reference "${value}"`)
  }

  for (const edge of content.edges) {
    ref(registry.node, edge.from, 'missing-node', `edges/${edge.id}.from`)
    ref(registry.node, edge.to, 'missing-node', `edges/${edge.id}.to`)
  }
  for (const service of content.services) ref(registry.node, service.nodeId, 'missing-node', `services/${service.id}`)
  for (const objective of content.objectives) {
    ref(registry.stakeholder, objective.ownerStakeholderId, 'missing-stakeholder', `objectives/${objective.id}`)
    for (const nodeId of objective.dependencyNodeIds) ref(registry.node, nodeId, 'missing-node', `objectives/${objective.id}`)
    if (objective.targetDay > CAMPAIGN_DAYS) {
      error('unreachable-objective', `objectives/${objective.id}`, `targetDay ${objective.targetDay} is beyond the campaign`)
    }
  }
  for (const control of content.controls) {
    for (const nodeId of control.targetNodeIds) ref(registry.node, nodeId, 'missing-node', `controls/${control.id}`)
  }
  for (const programme of content.programmes) {
    ref(registry.stakeholder, programme.preferredSponsorId, 'missing-stakeholder', `programmes/${programme.id}`)
    const milestoneProgresses = programme.milestones.map((m) => m.atProgress)
    if (!milestoneProgresses.some((p) => p >= 1)) {
      warn('programme-completion', `programmes/${programme.id}`, 'No milestone at full progress')
    }
    for (const milestone of programme.milestones) {
      for (const effect of milestone.controlEffects) {
        ref(registry.control, effect.controlId, 'missing-control', `programmes/${programme.id}/${milestone.id}`)
      }
      for (const effect of milestone.effects ?? []) {
        checkEffect(effect, registry, `programmes/${programme.id}/${milestone.id}`, error)
      }
    }
    for (const blocker of programme.blockers) {
      if (blocker.resolution.stakeholderId) {
        ref(registry.stakeholder, blocker.resolution.stakeholderId, 'missing-stakeholder', `programmes/${programme.id}/${blocker.id}`)
      }
    }
  }
  for (const path of content.attackPaths) {
    ref(registry.incidentFamily, path.incidentFamilyId, 'missing-incident-family', `attackPaths/${path.id}`)
    for (const actorId of Object.keys(path.actorAffinity)) ref(registry.actor, actorId, 'missing-actor', `attackPaths/${path.id}`)
    for (const serviceId of path.impactedServiceIds) ref(registry.service, serviceId, 'missing-service', `attackPaths/${path.id}`)
    for (const step of path.steps) {
      ref(registry.node, step.nodeId, 'missing-node', `attackPaths/${path.id}/${step.id}`)
      for (const controlId of step.controlIds) ref(registry.control, controlId, 'missing-control', `attackPaths/${path.id}/${step.id}`)
    }
  }
  for (const family of content.incidentFamilies) {
    for (const decisionId of family.responseDecisionIds) {
      ref(registry.decision, decisionId, 'missing-decision', `incidentFamilies/${family.id}`)
    }
  }
  for (const evidence of content.evidence) {
    for (const nodeId of evidence.affectedNodeIds) ref(registry.node, nodeId, 'missing-node', `evidence/${evidence.id}`)
  }
  for (const template of content.hypothesisTemplates) {
    ref(registry.scenario, template.linkedScenarioId, 'missing-scenario', `hypothesisTemplates/${template.id}`)
    for (const tag of template.supportingTags) {
      if (!registry.evidenceTag.has(tag)) {
        warn('unused-tag', `hypothesisTemplates/${template.id}`, `No evidence carries supporting tag "${tag}"`)
      }
    }
  }
  for (const scenario of content.riskScenarios) {
    ref(registry.stakeholder, scenario.ownerStakeholderId, 'missing-stakeholder', `riskScenarios/${scenario.id}`)
    for (const actorId of scenario.threatActorIds) ref(registry.actor, actorId, 'missing-actor', `riskScenarios/${scenario.id}`)
    for (const pathId of scenario.attackPathIds) ref(registry.attackPath, pathId, 'missing-path', `riskScenarios/${scenario.id}`)
    for (const serviceId of scenario.affectedServiceIds) ref(registry.service, serviceId, 'missing-service', `riskScenarios/${scenario.id}`)
    for (const nodeId of scenario.triggerNodeIds) ref(registry.node, nodeId, 'missing-node', `riskScenarios/${scenario.id}`)
    for (const programmeId of scenario.treatmentProgrammeIds) {
      ref(registry.programme, programmeId, 'missing-programme', `riskScenarios/${scenario.id}`)
    }
  }
  for (const investigation of content.investigations) {
    for (const evidenceId of [...investigation.guaranteedEvidenceIds, ...investigation.possibleEvidenceIds]) {
      ref(registry.evidence, evidenceId, 'missing-evidence', `investigations/${investigation.id}`)
    }
    for (const nodeId of investigation.revealsNodeIds) ref(registry.node, nodeId, 'missing-node', `investigations/${investigation.id}`)
    for (const edgeId of investigation.revealsEdgeIds) ref(registry.edge, edgeId, 'missing-edge', `investigations/${investigation.id}`)
    for (const controlId of investigation.assessesControlIds) {
      ref(registry.control, controlId, 'missing-control', `investigations/${investigation.id}`)
    }
    if (investigation.requiresCondition) {
      checkCondition(investigation.requiresCondition, registry, `investigations/${investigation.id}`, error)
    }
  }
  for (const decision of content.decisions) {
    const optionIds = new Set(decision.options.map((o) => o.id))
    if (!optionIds.has(decision.defaultOptionId)) {
      error('missing-default-option', `decisions/${decision.id}`, `defaultOptionId "${decision.defaultOptionId}" is not an option`)
    }
    for (const nodeId of decision.relatedNodeIds) ref(registry.node, nodeId, 'missing-node', `decisions/${decision.id}`)
    for (const tagId of decision.rationaleTagIds ?? []) ref(registry.rationaleTag, tagId, 'missing-rationale-tag', `decisions/${decision.id}`)
    for (const option of decision.options) {
      const where = `decisions/${decision.id}/${option.id}`
      for (const effect of option.immediateEffects) checkEffect(effect, registry, where, error)
      for (const delayed of option.delayedEffects ?? []) {
        for (const effect of delayed.effects) checkEffect(effect, registry, where, error)
      }
      for (const tagId of option.rationaleTagIds ?? []) ref(registry.rationaleTag, tagId, 'missing-rationale-tag', where)
      for (const assumptionId of option.assumptionIds ?? []) ref(registry.assumption, assumptionId, 'missing-assumption', where)
      if (option.requirements?.minTrustStakeholderId) {
        ref(registry.stakeholder, option.requirements.minTrustStakeholderId, 'missing-stakeholder', where)
      }
      if (option.requirements?.condition) checkCondition(option.requirements.condition, registry, where, error)
    }
  }
  for (const event of content.events) {
    const where = `events/${event.id}`
    if (event.decisionId) ref(registry.decision, event.decisionId, 'missing-decision', where)
    for (const nodeId of event.relatedNodeIds) ref(registry.node, nodeId, 'missing-node', where)
    for (const effect of event.effectsOnReveal ?? []) checkEffect(effect, registry, where, error)
    for (const condition of event.conditions) checkCondition(condition, registry, where, error)
    if (event.availableFromDay >= CAMPAIGN_DAYS) {
      error('unreachable-event', where, `availableFromDay ${event.availableFromDay} is at or beyond the end of the campaign`)
    }
    if (event.availableUntilDay !== undefined && event.availableUntilDay <= event.availableFromDay) {
      error('impossible-window', where, 'availableUntilDay is not after availableFromDay')
    }
  }
  for (const assumption of content.assumptions) {
    if (!VALIDATION_RULES[assumption.validationRuleId]) {
      error('missing-validation-rule', `assumptions/${assumption.id}`, `No rule named "${assumption.validationRuleId}"`)
    }
    for (const nodeId of assumption.linkedNodeIds) ref(registry.node, nodeId, 'missing-node', `assumptions/${assumption.id}`)
  }

  // ---- reachability --------------------------------------------------------
  // A pinned event gated on another event must be gated on one that can fire.
  for (const event of content.events) {
    const gatedOn = collectEventGates(event.conditions)
    for (const gateId of gatedOn) {
      if (!registry.event.has(gateId)) {
        error('missing-event', `events/${event.id}`, `Gated on unknown event "${gateId}"`)
        continue
      }
      const gate = content.events.find((e) => e.id === gateId)
      if (gate && gate.availableFromDay > event.availableFromDay && event.pinned) {
        warn('ordering', `events/${event.id}`, `Pinned event can only fire after "${gateId}", which is available later`)
      }
    }
  }
  // Every decision should be reachable from an event, an incident family or another decision.
  // The engine itself opens a few: an acceptance running out opens the
  // renewal decision, linked to whichever scenario it was.
  const reachableDecisions = new Set<string>(['dec-acceptance-renewal'])
  for (const event of content.events) if (event.decisionId) reachableDecisions.add(event.decisionId)
  for (const family of content.incidentFamilies) for (const d of family.responseDecisionIds) reachableDecisions.add(d)
  for (const decision of content.decisions) {
    for (const option of decision.options) {
      for (const effect of option.immediateEffects) {
        if (effect.type === 'decision.open') reachableDecisions.add(effect.decisionId)
      }
    }
  }
  for (const decision of content.decisions) {
    if (!reachableDecisions.has(decision.id)) {
      error('unreachable-decision', `decisions/${decision.id}`, 'No event, incident or decision can open this decision')
    }
  }
  // Every risk scenario should be reachable through a hypothesis or an effect.
  const reachableScenarios = new Set(content.hypothesisTemplates.map((h) => h.linkedScenarioId))
  for (const decision of content.decisions) {
    for (const option of decision.options) {
      for (const effect of [...option.immediateEffects, ...(option.delayedEffects ?? []).flatMap((d) => d.effects)]) {
        if (effect.type === 'risk.open') reachableScenarios.add(effect.scenarioId)
      }
    }
  }
  for (const scenario of content.riskScenarios) {
    if (!reachableScenarios.has(scenario.id)) {
      warn('unreachable-scenario', `riskScenarios/${scenario.id}`, 'No hypothesis or decision opens this scenario')
    }
  }

  // ---- graph cycles --------------------------------------------------------
  // depends_on / hosted_on must form a directed acyclic graph: a service that
  // transitively depends on itself would make consequence analysis meaningless.
  const acyclicTypes = new Set(['depends_on', 'hosted_on'])
  const adjacency = new Map<string, string[]>()
  for (const edge of content.edges) {
    if (!acyclicTypes.has(edge.type)) continue
    const list = adjacency.get(edge.from) ?? []
    list.push(edge.to)
    adjacency.set(edge.from, list)
  }
  const state = new Map<string, 'visiting' | 'done'>()
  const walk = (nodeId: string, trail: string[]): void => {
    const current = state.get(nodeId)
    if (current === 'done') return
    if (current === 'visiting') {
      error('dependency-cycle', `edges`, `Cycle: ${[...trail, nodeId].join(' -> ')}`)
      return
    }
    state.set(nodeId, 'visiting')
    for (const next of adjacency.get(nodeId) ?? []) walk(next, [...trail, nodeId])
    state.set(nodeId, 'done')
  }
  for (const nodeId of adjacency.keys()) walk(nodeId, [])

  // ---- balance sanity ------------------------------------------------------
  const totalProgrammeCost = content.programmes.reduce((sum, p) => sum + p.budgetCost, 0)
  if (totalProgrammeCost <= content.meta.startingBudget) {
    warn('budget-balance', 'meta', 'Every programme can be funded at once; there is no prioritisation pressure')
  }
  const pathsPerActor = new Map<string, number>()
  for (const path of content.attackPaths) {
    for (const [actorId, affinity] of Object.entries(path.actorAffinity)) {
      if ((affinity ?? 0) > 0.5) pathsPerActor.set(actorId, (pathsPerActor.get(actorId) ?? 0) + 1)
    }
  }
  for (const actor of content.actors) {
    if (!pathsPerActor.get(actor.id)) {
      warn('actor-without-path', `actors/${actor.id}`, 'No attack path strongly favours this actor')
    }
  }

  return issues
}

function collectEventGates(conditions: Condition[]): string[] {
  const out: string[] = []
  const walk = (condition: Condition) => {
    switch (condition.kind) {
      case 'event.fired':
      case 'event.notFired':
        out.push(condition.eventId)
        break
      case 'all':
      case 'any':
        condition.conditions.forEach(walk)
        break
      case 'not':
        walk(condition.condition)
        break
      default:
        break
    }
  }
  conditions.forEach(walk)
  return out
}

function checkCondition(
  condition: Condition,
  registry: Registry,
  where: string,
  error: (rule: string, where: string, detail: string) => void,
): void {
  const ref = (set: Set<string>, value: string, rule: string) => {
    if (!set.has(value)) error(rule, where, `Condition references unknown "${value}"`)
  }
  switch (condition.kind) {
    case 'node.discovered':
    case 'node.notDiscovered':
      ref(registry.node, condition.nodeId, 'missing-node')
      break
    case 'edge.exists':
    case 'edge.discovered':
      ref(registry.edge, condition.edgeId, 'missing-edge')
      break
    case 'control.coverageBelow':
    case 'control.coverageAtLeast':
    case 'control.effectivenessBelow':
      ref(registry.control, condition.controlId, 'missing-control')
      break
    case 'programme.status':
    case 'programme.progressAtLeast':
      ref(registry.programme, condition.programmeId, 'missing-programme')
      break
    case 'stakeholder.trustBelow':
    case 'stakeholder.trustAtLeast':
      ref(registry.stakeholder, condition.stakeholderId, 'missing-stakeholder')
      break
    case 'threat.pressureAtLeast':
      ref(registry.actor, condition.actorId, 'missing-actor')
      break
    case 'threat.campaignActive':
      if (condition.actorId) ref(registry.actor, condition.actorId, 'missing-actor')
      break
    case 'evidence.known':
      ref(registry.evidence, condition.evidenceId, 'missing-evidence')
      break
    case 'evidence.tagKnown':
      if (!registry.evidenceTag.has(condition.tag)) {
        error('impossible-condition', where, `No evidence carries tag "${condition.tag}"`)
      }
      break
    case 'risk.scenarioStatus':
      ref(registry.scenario, condition.scenarioId, 'missing-scenario')
      break
    case 'assumption.invalidated':
      ref(registry.assumption, condition.assumptionId, 'missing-assumption')
      break
    case 'objective.status':
      ref(registry.objective, condition.objectiveId, 'missing-objective')
      break
    case 'decision.optionTaken':
    case 'decision.resolved':
      ref(registry.decision, condition.decisionId, 'missing-decision')
      break
    case 'event.fired':
    case 'event.notFired':
      ref(registry.event, condition.eventId, 'missing-event')
      break
    case 'not':
      checkCondition(condition.condition, registry, where, error)
      break
    case 'all':
    case 'any':
      for (const child of condition.conditions) checkCondition(child, registry, where, error)
      break
    default:
      break
  }
}

function checkEffect(
  effect: GameEffect,
  registry: Registry,
  where: string,
  error: (rule: string, where: string, detail: string) => void,
): void {
  const ref = (set: Set<string>, value: string, rule: string) => {
    if (!set.has(value)) error(rule, where, `Effect "${effect.type}" references unknown "${value}"`)
  }
  switch (effect.type) {
    case 'stakeholder.trust':
    case 'stakeholder.concern':
    case 'stakeholder.understanding':
      ref(registry.stakeholder, effect.stakeholderId, 'missing-stakeholder')
      break
    case 'control.coverage':
    case 'control.configuration':
    case 'control.operational':
    case 'control.monitoring':
    case 'control.exceptions':
    case 'control.assess':
      ref(registry.control, effect.controlId, 'missing-control')
      break
    case 'programme.progress':
    case 'programme.status':
    case 'programme.blocker':
    case 'programme.resolveBlocker':
      ref(registry.programme, effect.programmeId, 'missing-programme')
      break
    case 'programme.sponsor':
      ref(registry.programme, effect.programmeId, 'missing-programme')
      ref(registry.stakeholder, effect.stakeholderId, 'missing-stakeholder')
      break
    case 'evidence.reveal':
      ref(registry.evidence, effect.evidenceId, 'missing-evidence')
      break
    case 'node.reveal':
    case 'node.exposure':
    case 'node.weakness':
      ref(registry.node, effect.nodeId, 'missing-node')
      break
    case 'edge.reveal':
      ref(registry.edge, effect.edgeId, 'missing-edge')
      break
    case 'assumption.record':
    case 'assumption.invalidate':
      ref(registry.assumption, effect.assumptionId, 'missing-assumption')
      break
    case 'event.schedule':
    case 'event.suppress':
      ref(registry.event, effect.eventId, 'missing-event')
      break
    case 'threat.pressure':
    case 'threat.interest':
    case 'threat.setback':
      ref(registry.actor, effect.actorId, 'missing-actor')
      break
    case 'objective.progress':
    case 'objective.delay':
    case 'objective.status':
      ref(registry.objective, effect.objectiveId, 'missing-objective')
      break
    case 'risk.open':
      ref(registry.scenario, effect.scenarioId, 'missing-scenario')
      break
    case 'risk.status':
    case 'risk.review':
      // `linked` is the scenario the decision was opened about, resolved at run time.
      if (effect.scenarioId !== 'linked') ref(registry.scenario, effect.scenarioId, 'missing-scenario')
      break
    case 'leader.morale':
      // `most-pressed` resolves at run time to whoever leads the function
      // closest to breaking; there is no leader to check it against.
      if (effect.leaderId !== 'most-pressed') ref(registry.leader, effect.leaderId, 'missing-leader')
      break
    case 'leader.confidence':
      ref(registry.leader, effect.leaderId, 'missing-leader')
      break
    case 'incident.start':
      ref(registry.incidentFamily, effect.familyId, 'missing-incident-family')
      if (effect.pathId) ref(registry.attackPath, effect.pathId, 'missing-path')
      if (effect.actorId) ref(registry.actor, effect.actorId, 'missing-actor')
      break
    case 'decision.open':
      ref(registry.decision, effect.decisionId, 'missing-decision')
      break
    case 'inbox.message':
      ref(registry.event, effect.messageId, 'missing-event')
      break
    default:
      break
  }
}
