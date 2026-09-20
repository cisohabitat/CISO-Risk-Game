/**
 * World generation. Everything variable about a campaign is drawn here from the
 * campaign seed, so two runs of the same seed are identical and two different
 * seeds tell materially different stories (plan §27).
 */
import type {
  ContentIndex,
  Difficulty,
  GameState,
  OrgEdgeState,
  OrgNodeState,
} from '../types'
import { CYBER_FUNCTIONS, SAVE_SCHEMA_VERSION, clamp01 } from '../types'
import { deriveRng } from './rng'
import { recomputeUnderstanding } from '../knowledge/discovery'

/**
 * Everything a difficulty mode changes, in one place (plan §44).
 *
 * The profile is the only description of a mode. Branching on
 * `state.difficulty` anywhere else splits that description across files, which
 * is how this game ended up escalating threat three times over: the profile
 * multiplier at setup, a second hard-coded factor applied daily in the threat
 * engine, and a third in sector pressure — while `noiseMultiplier` sat here
 * unread because the event engine had its own copy of the numbers. A test
 * fails the build on a difficulty branch outside this file.
 */
export interface DifficultyProfile {
  budgetMultiplier: number
  capacityMultiplier: number
  focusPerWeek: number
  /** Applied once at setup, to starting actor activity and sector pressure. */
  threatMultiplier: number
  /** Applied daily, to how readily campaigns start and advance. */
  threatTempo: number
  /** Where sector-wide pressure settles over the year. */
  sectorPressurePull: number
  startingDiscovery: number
  /**
   * Weights `noise`-tagged events up in the daily draw (plan §44: harder modes
   * bury the material signal in more noise).
   *
   * It currently has almost nothing to act on. Two of the 123 authored events
   * carry the tag and both are one-shot, so over 40 campaigns per mode exactly
   * 2.00 of them fire in every campaign at every difficulty — 2.3% of the ~85
   * events a year — and the multiplier only shifts which day they land on.
   * Raising it will not make a mode noisier; that needs authored events, and
   * the discrimination the plan is after is currently carried by evidence
   * instead (4 of 48 marked `noise`, 2 more tagged `contradicts-`), which no
   * difficulty dial touches.
   */
  noiseMultiplier: number
  executiveTolerance: number
  investigationSpeed: number
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  guided: {
    budgetMultiplier: 1.25,
    capacityMultiplier: 1.2,
    focusPerWeek: 6,
    threatMultiplier: 0.75,
    threatTempo: 0.72,
    sectorPressurePull: 0.34,
    startingDiscovery: 0.45,
    noiseMultiplier: 0.7,
    executiveTolerance: 0.62,
    investigationSpeed: 0.85,
  },
  ciso: {
    budgetMultiplier: 1,
    capacityMultiplier: 1,
    focusPerWeek: 5,
    threatMultiplier: 1,
    threatTempo: 1,
    sectorPressurePull: 0.48,
    startingDiscovery: 0.3,
    noiseMultiplier: 1,
    executiveTolerance: 0.5,
    investigationSpeed: 1,
  },
  // High pressure makes the world harsher and leaves the player's levers close
  // to intact. Squeezing both — as this used to — cuts the very channels
  // through which skill pays, which is how hard mode ended up flatter than
  // normal: good play bought 26% fewer incidents here against 37% on CISO.
  'high-pressure': {
    budgetMultiplier: 0.9,
    capacityMultiplier: 0.95,
    focusPerWeek: 5,
    threatMultiplier: 1.3,
    threatTempo: 1.1,
    sectorPressurePull: 0.62,
    startingDiscovery: 0.2,
    noiseMultiplier: 1.3,
    executiveTolerance: 0.38,
    investigationSpeed: 1.1,
  },
}

export interface NewGameOptions {
  seed: string
  difficulty?: Difficulty
  gameId?: string
  createdAtIso?: string
}

export function createInitialState(index: ContentIndex, options: NewGameOptions): GameState {
  const { content } = index
  const difficulty = options.difficulty ?? 'ciso'
  const profile = DIFFICULTY_PROFILES[difficulty]
  const seed = options.seed

  // Independent streams so adding a draw in one area cannot reshuffle another.
  const worldRng = deriveRng(seed, 'world')
  const peopleRng = deriveRng(seed, 'people')
  const controlRng = deriveRng(seed, 'controls')
  const threatRng = deriveRng(seed, 'threats')

  const nodes: Record<string, OrgNodeState> = {}
  for (const def of content.nodes) {
    // Difficulty changes how much of the estate the previous CISO left
    // documented, rather than changing attack probability (plan §44).
    const inheritedSight =
      def.knownAtStart || (def.criticality !== 'low' && worldRng.chance(profile.startingDiscovery * 0.5))
    nodes[def.id] = {
      id: def.id,
      exists: true,
      discovered: inheritedSight,
      discoveryConfidence: inheritedSight ? clamp01(0.35 + profile.startingDiscovery + worldRng.jitter(0.15)) : 0,
      exposure: clamp01(def.exposure + worldRng.jitter(0.12)),
      weakness: clamp01(def.weakness + worldRng.jitter(0.14)),
      notes: [],
    }
  }

  const edges: Record<string, OrgEdgeState> = {}
  for (const def of content.edges) {
    // Optional edges are the hidden starting configuration: which awkward
    // dependencies this particular Nexora actually has.
    const exists = def.variantWeight >= 1 ? true : worldRng.chance(def.variantWeight)
    edges[def.id] = {
      id: def.id,
      exists,
      discovered: exists && def.knownAtStart,
      discoveryConfidence: exists && def.knownAtStart ? 0.6 : 0,
    }
  }

  const controls: GameState['controls'] = { controls: {} }
  for (const def of content.controls) {
    const v = def.variance
    controls.controls[def.id] = {
      id: def.id,
      coverage: clamp01(def.baseCoverage + controlRng.jitter(v)),
      configurationQuality: clamp01(def.baseConfigurationQuality + controlRng.jitter(v)),
      operationalEffectiveness: clamp01(def.baseOperationalEffectiveness + controlRng.jitter(v)),
      monitoringQuality: clamp01(def.baseMonitoringQuality + controlRng.jitter(v)),
      exceptionRate: clamp01(def.baseExceptionRate + controlRng.jitter(v)),
      // The inherited assurance picture is stale and optimistic: the player
      // believes coverage is better than it is until they go and look.
      believed: {
        coverage: clamp01(def.baseCoverage + 0.12 + controlRng.jitter(0.08)),
        configurationQuality: clamp01(def.baseConfigurationQuality + 0.1),
        operationalEffectiveness: clamp01(def.baseOperationalEffectiveness + 0.1),
        monitoringQuality: clamp01(def.baseMonitoringQuality + 0.08),
        exceptionRate: clamp01(def.baseExceptionRate - 0.08),
        assessedOnDay: -180,
      },
    }
  }

  const stakeholders: GameState['stakeholders'] = {
    stakeholders: {},
    boardConfidence: clamp01(0.5 + peopleRng.jitter(0.08)),
    operationalTolerance: profile.executiveTolerance,
  }
  for (const def of content.stakeholders) {
    stakeholders.stakeholders[def.id] = {
      id: def.id,
      trust: clamp01(def.baseTrust + peopleRng.jitter(def.variance)),
      cyberUnderstanding: clamp01(def.baseCyberUnderstanding + peopleRng.jitter(def.variance)),
      riskTolerance: clamp01(def.baseRiskTolerance + peopleRng.jitter(def.variance)),
      concerns: def.activeConcerns.slice(0, 3),
      memory: [],
    }
  }

  const team: GameState['team'] = { functions: {}, leaders: {}, assignments: [], assignmentCounter: 0 }
  const baseCapacity: Record<string, number> = {
    soc: 5,
    engineering: 4,
    architecture: 3,
    grc: 3,
    iam: 3,
    'incident-response': 2,
  }
  const vacancyPool = peopleRng.shuffle(CYBER_FUNCTIONS).slice(0, 3)
  for (const fn of CYBER_FUNCTIONS) {
    const vacancies = vacancyPool.includes(fn) ? peopleRng.int(1, 2) : 0
    team.functions[fn] = {
      fn,
      capacity: Math.max(1, Math.round((baseCapacity[fn] ?? 3) * profile.capacityMultiplier - vacancies * 0.5)),
      committed: 0,
      morale: clamp01(0.62 + peopleRng.jitter(0.12)),
      vacancies,
    }
  }
  for (const def of content.leaders) {
    team.leaders[def.id] = {
      id: def.id,
      skill: clamp01(def.baseSkill + peopleRng.jitter(def.variance)),
      reliability: clamp01(def.baseReliability + peopleRng.jitter(def.variance)),
      morale: clamp01(def.baseMorale + peopleRng.jitter(def.variance)),
      workload: clamp01(0.35 + peopleRng.jitter(0.18)),
      assignmentsCompleted: 0,
      assignmentsLate: 0,
    }
  }

  const programmes: GameState['programmes'] = { programmes: {} }
  for (const def of content.programmes) {
    programmes.programmes[def.id] = {
      id: def.id,
      status: 'proposed',
      progress: 0,
      budgetAllocated: 0,
      budgetSpent: 0,
      staffing: 0,
      blockers: [],
      completedMilestoneIds: [],
      // Some programmes are simply harder to deliver in this organisation.
      deliveryFriction: clamp01(0.08 + worldRng.jitter(0.08)),
      accelerated: false,
    }
  }

  const threats: GameState['threats'] = {
    actors: {},
    campaigns: [],
    sectorPressure: clamp01(0.4 * profile.threatMultiplier + threatRng.jitter(0.1)),
  }
  for (const def of content.actors) {
    threats.actors[def.id] = {
      id: def.id,
      activityLevel: clamp01(def.baseActivity * profile.threatMultiplier + threatRng.jitter(def.variance)),
      interest: clamp01(0.2 + threatRng.jitter(0.12)),
      pressure: 0,
      discovered: false,
    }
  }

  const business: GameState['business'] = { objectives: {}, serviceHealth: {}, outageDays: {} }
  for (const def of content.objectives) {
    business.objectives[def.id] = {
      id: def.id,
      progress: clamp01(worldRng.range(0.02, 0.12)),
      status: 'planned',
      targetDay: def.targetDay,
      delayDays: 0,
      conditionsAttached: [],
      securitySupported: false,
    }
  }
  for (const service of content.services) {
    business.serviceHealth[service.nodeId] = 1
    business.outageDays[service.nodeId] = 0
  }

  const state: GameState = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gameId: options.gameId ?? `game-${seed}`,
    seed,
    contentId: content.meta.id,
    contentVersion: content.meta.version,
    difficulty,
    createdAtIso: options.createdAtIso ?? '1970-01-01T00:00:00.000Z',
    currentDay: 0,
    speed: 'paused',
    paused: true,
    pauseReasons: [],
    rngCursor: 0,
    finished: false,
    organisation: { nodes, edges, understanding: {} },
    business,
    threats,
    controls,
    programmes,
    risks: { hypotheses: {}, scenarios: {}, hypothesisCounter: 0 },
    evidence: { items: {}, order: [] },
    stakeholders,
    team,
    inbox: { messages: [], counter: 0 },
    events: {
      firedEventIds: [],
      firedOnDay: {},
      suppressedEventIds: [],
      scheduled: [],
      lastFiredDayByTag: {},
      dailyFiredCount: 0,
    },
    decisions: { decisions: {}, openIds: [], resolvedIds: [], counter: 0 },
    assumptions: { assumptions: {}, counter: 0 },
    incidents: { incidents: {}, order: [], counter: 0 },
    resources: {
      budgetTotal: Math.round(content.meta.startingBudget * profile.budgetMultiplier),
      budgetRemaining: Math.round(content.meta.startingBudget * profile.budgetMultiplier),
      budgetCommitted: 0,
      focusPerWeek: profile.focusPerWeek,
      focusRemaining: profile.focusPerWeek,
      weekIndex: 0,
    },
    history: { entries: [], weekly: [], decisionsLog: [] },
    reviews: { quarters: [] },
    tutorial: { seen: [], dismissed: [] },
    pendingEffects: [],
    flags: { 'legacy.retirementDay': 250 },
  }

  // Emerging scenarios: the inherited risk register already gestures at some of
  // these, but confidence is low until the player does the work.
  for (const def of content.riskScenarios) {
    const seeded = worldRng.chance(0.45)
    if (!seeded) continue
    state.risks.scenarios[def.id] = {
      id: def.id,
      openedDay: 0,
      status: 'emerging',
      confidence: 'limited',
      ownerStakeholderId: def.ownerStakeholderId,
      decisionIds: [],
      assumptionIds: [],
      nextReviewDay: 45,
      lastAssessed: null,
      escalatedToBoard: false,
      notes: ['Inherited from the previous risk register. Unverified.'],
    }
  }

  recomputeUnderstanding(state, index)
  return state
}
