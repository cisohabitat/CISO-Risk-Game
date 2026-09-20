/**
 * Zod schemas for authored campaign content (plan §32.5, §41).
 *
 * These run in development, in `pnpm validate:content` and in tests. Invalid
 * content fails loudly rather than producing a quietly incoherent simulation.
 */
import { z } from 'zod'

const unit = z.number().min(0).max(1)
const id = z.string().min(1)

export const conditionSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('always') }),
    z.object({ kind: z.literal('day.after'), day: z.number().int().min(0) }),
    z.object({ kind: z.literal('day.before'), day: z.number().int().min(0) }),
    z.object({ kind: z.literal('flag.set'), flag: z.string() }),
    z.object({ kind: z.literal('flag.notSet'), flag: z.string() }),
    z.object({ kind: z.literal('flag.atLeast'), flag: z.string(), value: z.number() }),
    z.object({ kind: z.literal('node.discovered'), nodeId: id }),
    z.object({ kind: z.literal('node.notDiscovered'), nodeId: id }),
    z.object({ kind: z.literal('edge.exists'), edgeId: id }),
    z.object({ kind: z.literal('edge.discovered'), edgeId: id }),
    z.object({ kind: z.literal('control.coverageBelow'), controlId: id, value: unit }),
    z.object({ kind: z.literal('control.coverageAtLeast'), controlId: id, value: unit }),
    z.object({ kind: z.literal('control.effectivenessBelow'), controlId: id, value: unit }),
    z.object({ kind: z.literal('programme.status'), programmeId: id, status: z.string() }),
    z.object({ kind: z.literal('programme.progressAtLeast'), programmeId: id, value: unit }),
    z.object({ kind: z.literal('programme.anyActive') }),
    z.object({ kind: z.literal('programme.anyBlocked') }),
    z.object({ kind: z.literal('programme.anyOnPlan') }),
    z.object({ kind: z.literal('stakeholder.trustBelow'), stakeholderId: id, value: unit }),
    z.object({ kind: z.literal('stakeholder.trustAtLeast'), stakeholderId: id, value: unit }),
    z.object({ kind: z.literal('threat.pressureAtLeast'), actorId: id, value: unit }),
    z.object({ kind: z.literal('threat.campaignActive'), actorId: id.optional() }),
    z.object({ kind: z.literal('threat.campaignStageAtLeast'), stage: z.string() }),
    z.object({ kind: z.literal('incident.active') }),
    z.object({ kind: z.literal('incident.none') }),
    z.object({ kind: z.literal('incident.resolvedCountAtLeast'), value: z.number().int() }),
    z.object({ kind: z.literal('evidence.known'), evidenceId: id }),
    z.object({ kind: z.literal('evidence.tagKnown'), tag: z.string() }),
    z.object({ kind: z.literal('evidence.countAtLeast'), value: z.number().int() }),
    z.object({ kind: z.literal('risk.scenarioStatus'), scenarioId: id, status: z.string() }),
    z.object({ kind: z.literal('risk.openCountAtLeast'), value: z.number().int() }),
    z.object({ kind: z.literal('assumption.invalidated'), assumptionId: id }),
    z.object({ kind: z.literal('team.capacityBandAtLeast'), band: z.string() }),
    z.object({ kind: z.literal('team.moraleBelow'), value: unit }),
    z.object({ kind: z.literal('budget.remainingBelow'), value: z.number() }),
    z.object({ kind: z.literal('budget.remainingAtLeast'), value: z.number() }),
    z.object({ kind: z.literal('objective.status'), objectiveId: id, status: z.string() }),
    z.object({ kind: z.literal('decision.optionTaken'), decisionId: id, optionId: id }),
    z.object({ kind: z.literal('decision.resolved'), decisionId: id }),
    z.object({ kind: z.literal('event.fired'), eventId: id }),
    z.object({ kind: z.literal('event.notFired'), eventId: id }),
    z.object({ kind: z.literal('not'), condition: conditionSchema }),
    z.object({ kind: z.literal('all'), conditions: z.array(conditionSchema) }),
    z.object({ kind: z.literal('any'), conditions: z.array(conditionSchema) }),
  ]),
)

const cyberFunction = z.enum(['soc', 'engineering', 'architecture', 'grc', 'iam', 'incident-response'])
const functionTarget = cyberFunction.or(z.literal('most-pressed'))

export const effectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('budget.change'), amount: z.number(), note: z.string().optional() }),
  z.object({ type: z.literal('focus.change'), amount: z.number() }),
  z.object({ type: z.literal('capacity.change'), fn: functionTarget, delta: z.number() }),
  z.object({ type: z.literal('stakeholder.trust'), stakeholderId: id, delta: z.number(), reason: z.string().optional() }),
  z.object({ type: z.literal('stakeholder.concern'), stakeholderId: id, concern: z.string() }),
  z.object({ type: z.literal('stakeholder.understanding'), stakeholderId: id, delta: z.number() }),
  z.object({ type: z.literal('control.coverage'), controlId: id, delta: z.number() }),
  z.object({ type: z.literal('control.configuration'), controlId: id, delta: z.number() }),
  z.object({ type: z.literal('control.operational'), controlId: id, delta: z.number() }),
  z.object({ type: z.literal('control.monitoring'), controlId: id, delta: z.number() }),
  z.object({ type: z.literal('control.exceptions'), controlId: id, delta: z.number() }),
  z.object({ type: z.literal('control.assess'), controlId: id }),
  z.object({ type: z.literal('programme.progress'), programmeId: id, delta: z.number() }),
  z.object({ type: z.literal('programme.status'), programmeId: id, status: z.enum(['proposed', 'active', 'paused', 'complete', 'at-risk']) }),
  z.object({ type: z.literal('programme.blocker'), programmeId: id, blockerId: id }),
  z.object({ type: z.literal('programme.resolveBlocker'), programmeId: id, blockerId: id }),
  z.object({ type: z.literal('programme.sponsor'), programmeId: id, stakeholderId: id }),
  z.object({ type: z.literal('evidence.reveal'), evidenceId: id, note: z.string().optional() }),
  z.object({ type: z.literal('node.reveal'), nodeId: id, confidence: unit.optional() }),
  z.object({ type: z.literal('edge.reveal'), edgeId: id }),
  z.object({ type: z.literal('node.exposure'), nodeId: id, delta: z.number() }),
  z.object({ type: z.literal('node.weakness'), nodeId: id, delta: z.number() }),
  z.object({ type: z.literal('assumption.record'), assumptionId: id, decisionId: id.optional() }),
  z.object({ type: z.literal('assumption.invalidate'), assumptionId: id, reason: z.string().optional() }),
  z.object({ type: z.literal('event.schedule'), eventId: id, dayOffset: z.number().int() }),
  z.object({ type: z.literal('event.suppress'), eventId: id }),
  z.object({ type: z.literal('threat.pressure'), actorId: id, delta: z.number() }),
  z.object({ type: z.literal('threat.interest'), actorId: id, delta: z.number() }),
  z.object({ type: z.literal('threat.setback'), actorId: id, stages: z.number().int(), note: z.string().optional() }),
  z.object({ type: z.literal('objective.progress'), objectiveId: id, delta: z.number() }),
  z.object({ type: z.literal('objective.delay'), objectiveId: id, days: z.number().int() }),
  z.object({ type: z.literal('objective.status'), objectiveId: id, status: z.enum(['planned', 'active', 'at-risk', 'achieved', 'failed']) }),
  z.object({ type: z.literal('risk.open'), scenarioId: id }),
  z.object({ type: z.literal('risk.status'), scenarioId: id, status: z.enum(['emerging', 'open', 'accepted', 'treated', 'closed']) }),
  z.object({ type: z.literal('risk.review'), scenarioId: id, dayOffset: z.number().int() }),
  z.object({ type: z.literal('team.morale'), fn: functionTarget.optional(), delta: z.number() }),
  z.object({ type: z.literal('team.workload'), fn: functionTarget, delta: z.number() }),
  z.object({ type: z.literal('work.stop'), fn: functionTarget.optional() }),
  z.object({ type: z.literal('leader.morale'), leaderId: id, delta: z.number() }),
  z.object({ type: z.literal('leader.confidence'), leaderId: id, delta: z.number() }),
  z.object({ type: z.literal('team.vacancyFilled'), fn: cyberFunction }),
  z.object({ type: z.literal('incident.start'), familyId: id, pathId: id.optional(), actorId: id.optional() }),
  z.object({ type: z.literal('incident.containment'), delta: z.number() }),
  z.object({ type: z.literal('incident.recovery'), delta: z.number() }),
  z.object({ type: z.literal('incident.consequence'), delta: z.number() }),
  z.object({ type: z.literal('flag.set'), flag: z.string(), value: z.union([z.number(), z.string(), z.boolean()]).optional() }),
  z.object({ type: z.literal('flag.increment'), flag: z.string(), amount: z.number() }),
  z.object({ type: z.literal('inbox.message'), messageId: id }),
  z.object({ type: z.literal('history.note'), kind: z.string(), summary: z.string() }),
  z.object({ type: z.literal('decision.open'), decisionId: id, deadlineDays: z.number().int().optional() }),
  z.object({ type: z.literal('board.confidence'), delta: z.number() }),
  z.object({ type: z.literal('operationalTolerance'), delta: z.number() }),
])

// Partial map: content only lists the functions a piece of work actually needs.
const capacityDemand = z.record(z.string(), z.number().min(0)).default({})

export const orgNodeSchema = z.object({
  id,
  type: z.enum(['objective', 'service', 'application', 'infrastructure', 'cloud-platform', 'identity', 'network-zone', 'supplier', 'data-set', 'control']),
  name: z.string().min(1),
  description: z.string().min(1),
  criticality: z.enum(['low', 'medium', 'high', 'critical']),
  knownAtStart: z.boolean(),
  exposure: unit,
  weakness: unit,
  tags: z.array(z.string()),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
})

export const orgEdgeSchema = z.object({
  id,
  from: id,
  to: id,
  type: z.enum(['depends_on', 'authenticates_via', 'hosted_on', 'administered_by', 'connected_to', 'supplied_by', 'processes_data_for', 'protects', 'monitors']),
  description: z.string().min(1),
  knownAtStart: z.boolean(),
  variantWeight: unit,
  tags: z.array(z.string()),
})

export const serviceSchema = z.object({
  id,
  nodeId: id,
  name: z.string(),
  description: z.string(),
  revenueShare: unit,
  outageToleranceHours: z.number().positive(),
  regulatoryExposure: unit,
})

export const objectiveSchema = z.object({
  id,
  name: z.string(),
  description: z.string(),
  targetDay: z.number().int().positive(),
  importance: z.enum(['medium', 'high', 'critical']),
  dependencyNodeIds: z.array(id),
  ownerStakeholderId: id,
  value: unit,
})

export const stakeholderSchema = z.object({
  id,
  name: z.string(),
  role: z.string(),
  shortRole: z.string(),
  priorities: z.array(z.string()),
  baseCyberUnderstanding: unit,
  baseRiskTolerance: unit,
  baseTrust: unit,
  variance: unit,
  activeConcerns: z.array(z.string()),
  voice: z.string(),
})

export const leaderSchema = z.object({
  id,
  name: z.string(),
  role: z.string(),
  functions: z.array(cyberFunction).min(1),
  baseSkill: unit,
  baseReliability: unit,
  baseMorale: unit,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  variance: unit,
})

const attackTechnique = z.enum([
  'phishing', 'credential-stuffing', 'supplier-remote-access', 'exploit-public-app',
  'privilege-abuse', 'lateral-movement', 'data-exfiltration', 'encryption-impact', 'persistence',
])

export const controlSchema = z.object({
  id,
  name: z.string(),
  shortName: z.string(),
  category: z.enum(['identity', 'privileged-access', 'network', 'endpoint', 'detection', 'recovery', 'third-party', 'vulnerability', 'cloud']),
  description: z.string(),
  baseCoverage: unit,
  baseConfigurationQuality: unit,
  baseOperationalEffectiveness: unit,
  baseMonitoringQuality: unit,
  baseExceptionRate: unit,
  variance: unit,
  targetNodeIds: z.array(id),
  mitigates: z.record(z.string(), unit),
  detectionStrength: unit,
  recoveryStrength: unit,
  driftPerDay: z.number().min(0).max(0.01),
  driftKind: z.enum(['coverage-erosion', 'operational-decay', 'exception-accumulation']),
  driftFloor: z.number().min(0).max(1),
})

const controlEffectSchema = z.object({
  controlId: id,
  coverage: z.number().optional(),
  configurationQuality: z.number().optional(),
  operationalEffectiveness: z.number().optional(),
  monitoringQuality: z.number().optional(),
  exceptionRate: z.number().optional(),
})

export const programmeSchema = z.object({
  id,
  name: z.string(),
  shortName: z.string(),
  description: z.string(),
  rationale: z.string(),
  budgetCost: z.number().positive(),
  durationDays: z.number().int().positive(),
  capacityDemand,
  preferredSponsorId: id,
  businessFriction: unit,
  tags: z.array(z.string()),
  milestones: z.array(
    z.object({
      id,
      name: z.string(),
      atProgress: unit,
      description: z.string(),
      controlEffects: z.array(controlEffectSchema),
      effects: z.array(effectSchema).optional(),
    }),
  ).min(1),
  blockers: z.array(
    z.object({
      id,
      name: z.string(),
      description: z.string(),
      chancePerDay: z.number().min(0).max(0.5),
      progressMultiplier: unit,
      resolution: z.object({
        label: z.string(),
        budget: z.number().optional(),
        focus: z.number().optional(),
        stakeholderId: id.optional(),
        description: z.string(),
      }),
    }),
  ),
})

export const actorSchema = z.object({
  id,
  name: z.string(),
  archetype: z.string(),
  motivation: z.string(),
  description: z.string(),
  capability: unit,
  persistence: unit,
  baseActivity: unit,
  variance: unit,
  targetPreferences: z.array(z.string()),
  techniquePreferences: z.array(attackTechnique),
  objective: z.enum(['disruption', 'extortion', 'theft', 'espionage']),
})

export const attackPathSchema = z.object({
  id,
  name: z.string(),
  summary: z.string(),
  actorAffinity: z.record(z.string(), unit),
  attractiveness: unit,
  impactedServiceIds: z.array(id),
  incidentFamilyId: id,
  steps: z.array(
    z.object({
      id,
      nodeId: id,
      technique: attackTechnique,
      narrative: z.string(),
      difficulty: unit,
      controlIds: z.array(id),
    }),
  ).min(1),
})

export const incidentFamilySchema = z.object({
  id,
  name: z.string(),
  description: z.string(),
  headline: z.string(),
  baseDisruption: unit,
  baseDataImpact: unit,
  baseDurationDays: z.number().int().positive(),
  regulatoryInterest: unit,
  responseDecisionIds: z.array(id),
  whatHelped: z.array(z.string()),
  whatHurt: z.array(z.string()),
})

export const evidenceSchema = z.object({
  id,
  title: z.string(),
  description: z.string(),
  sourceType: z.enum(['vulnerability', 'audit', 'threat-intel', 'recovery-test', 'architecture', 'unsupported-technology', 'supplier', 'soc-signal', 'staff-observation', 'control-test', 'business', 'incident']),
  confidence: z.enum(['low', 'medium', 'high']),
  affectedNodeIds: z.array(id),
  tags: z.array(z.string()),
  noise: z.boolean(),
  interpretation: z.string(),
  expiresAfterDays: z.number().int().positive().optional(),
})

export const hypothesisTemplateSchema = z.object({
  id,
  title: z.string(),
  statement: z.string(),
  supportingTags: z.array(z.string()),
  contradictingTags: z.array(z.string()),
  linkedScenarioId: id,
  requiresTags: z.array(z.string()),
})

export const riskScenarioSchema = z.object({
  id,
  title: z.string(),
  statement: z.string(),
  threatActorIds: z.array(id),
  attackPathIds: z.array(id),
  affectedServiceIds: z.array(id),
  triggerNodeIds: z.array(id),
  consequences: z.array(z.string()),
  treatmentProgrammeIds: z.array(id),
  ownerStakeholderId: id,
  family: z.string(),
})

export const investigationSchema = z.object({
  id,
  name: z.string(),
  description: z.string(),
  workingNarrative: z.string(),
  functions: z.array(cyberFunction),
  capacityPerDay: capacityDemand,
  durationDays: z.number().int().positive(),
  focusCost: z.number().int().min(0),
  budgetCost: z.number().min(0),
  possibleEvidenceIds: z.array(id),
  guaranteedEvidenceIds: z.array(id),
  revealsNodeIds: z.array(id),
  revealsEdgeIds: z.array(id),
  assessesControlIds: z.array(id),
  tags: z.array(z.string()),
  repeatable: z.boolean(),
  requiresCondition: conditionSchema.optional(),
})

export const decisionSchema = z.object({
  id,
  title: z.string(),
  description: z.string(),
  context: z.string(),
  deadlineDays: z.number().int().positive().optional(),
  defaultOptionId: id,
  requiresRationale: z.boolean(),
  relatedNodeIds: z.array(id),
  teaches: z.string().optional(),
  options: z.array(
    z.object({
      id,
      label: z.string(),
      description: z.string(),
      visibleKnownEffects: z.array(z.string()).default([]),
      immediateEffects: z.array(effectSchema),
      delayedEffects: z.array(
        z.object({ dayOffset: z.number().int().positive(), effects: z.array(effectSchema), note: z.string().optional() }),
      ).optional(),
      requirements: z.object({
        budget: z.number().optional(),
        focus: z.number().optional(),
        minTrustStakeholderId: id.optional(),
        minTrust: unit.optional(),
        condition: conditionSchema.optional(),
      }).optional(),
      budgetTreatment: z.enum(['discretionary', 'imposed', 'emergency']).optional(),
      rationaleTagIds: z.array(id).optional(),
      assumptionIds: z.array(id).optional(),
    }),
  ).min(2),
})

export const eventSchema = z.object({
  id,
  type: z.enum(['business', 'threat', 'programme', 'people', 'supplier', 'executive', 'board', 'discovery', 'incident', 'assumption']),
  title: z.string(),
  from: z.string(),
  body: z.string(),
  priority: z.enum(['routine', 'notable', 'urgent', 'critical']),
  availableFromDay: z.number().int().min(0),
  availableUntilDay: z.number().int().optional(),
  conditions: z.array(conditionSchema),
  weight: z.number().positive(),
  pinned: z.boolean(),
  scheduledOnly: z.boolean().optional(),
  oncePerCampaign: z.boolean(),
  cooldownDays: z.number().int().positive().optional(),
  effectsOnReveal: z.array(effectSchema).optional(),
  decisionId: id.optional(),
  relatedNodeIds: z.array(id),
  tags: z.array(z.string()),
})

export const rationaleTagSchema = z.object({ id, label: z.string(), description: z.string(), dimension: z.string() })

export const assumptionSchema = z.object({
  id,
  statement: z.string(),
  validationRuleId: z.string(),
  reviewAfterDays: z.number().int().positive(),
  linkedNodeIds: z.array(id),
})

export const glossarySchema = z.object({ id, term: z.string(), definition: z.string(), guidedNote: z.string().optional() })

export const campaignMetaSchema = z.object({
  id,
  title: z.string(),
  organisation: z.string(),
  summary: z.string(),
  openingBriefing: z.string(),
  durationDays: z.number().int().positive(),
  startingBudget: z.number().positive(),
  focusPerWeek: z.number().int().positive(),
  version: z.string(),
})

export const campaignContentSchema = z.object({
  meta: campaignMetaSchema,
  nodes: z.array(orgNodeSchema).min(1),
  edges: z.array(orgEdgeSchema),
  services: z.array(serviceSchema).min(1),
  objectives: z.array(objectiveSchema).min(1),
  stakeholders: z.array(stakeholderSchema).min(1),
  leaders: z.array(leaderSchema).min(1),
  controls: z.array(controlSchema).min(1),
  programmes: z.array(programmeSchema).min(1),
  actors: z.array(actorSchema).min(1),
  attackPaths: z.array(attackPathSchema).min(1),
  incidentFamilies: z.array(incidentFamilySchema).min(1),
  evidence: z.array(evidenceSchema).min(1),
  hypothesisTemplates: z.array(hypothesisTemplateSchema).min(1),
  riskScenarios: z.array(riskScenarioSchema).min(1),
  investigations: z.array(investigationSchema).min(1),
  decisions: z.array(decisionSchema).min(1),
  events: z.array(eventSchema).min(1),
  rationaleTags: z.array(rationaleTagSchema).min(1),
  assumptions: z.array(assumptionSchema).min(1),
  glossary: z.array(glossarySchema).min(1),
})
