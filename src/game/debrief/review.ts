/**
 * Quarterly board reviews and the annual CISO review (plan §26).
 *
 * The output is narrative and multi-dimensional. A single score would teach the
 * wrong lesson, so the performance band is deliberately secondary.
 */
import type {
  AnnualReview,
  AnnualReviewDimension,
  ContentIndex,
  GameEffect,
  GameState,
  QuarterReviewState,
} from '../types'
import { clamp01 } from '../types'
import { blindSpots } from '../knowledge/discovery'
import { unexaminedAssumptions } from '../assumptions/validation'
import { riskBand } from '../risk/bands'
import { teamStrain } from '../team/capacity'

export interface QuarterReviewInput {
  quarter: number
  topics: string[]
  recommendations: string[]
  communicateUncertainty: boolean
}

export interface QuarterReviewOutput extends QuarterReviewState {
  effects: GameEffect[]
}

/** Material topics the board should have heard about this quarter. */
export function materialTopics(state: GameState, index: ContentIndex): { id: string; label: string; material: boolean }[] {
  const out: { id: string; label: string; material: boolean }[] = []
  for (const scenario of Object.values(state.risks.scenarios)) {
    if (scenario.status === 'closed' || scenario.status === 'emerging') continue
    const def = index.riskScenario.get(scenario.id)
    if (!def) continue
    const residual = scenario.lastAssessed?.residual ?? 0
    out.push({ id: `risk:${scenario.id}`, label: def.title, material: residual >= 0.45 })
  }
  for (const incident of Object.values(state.incidents.incidents)) {
    const family = index.incidentFamily.get(incident.familyId)
    if (!family) continue
    out.push({ id: `incident:${incident.id}`, label: `${family.name} (incident)`, material: true })
  }
  for (const assumption of Object.values(state.assumptions.assumptions)) {
    if (assumption.status !== 'invalidated') continue
    out.push({ id: `assumption:${assumption.id}`, label: `Assumption failed: ${assumption.statement}`, material: true })
  }
  for (const programme of Object.values(state.programmes.programmes)) {
    if (programme.status !== 'at-risk') continue
    const def = index.programme.get(programme.id)
    if (def) out.push({ id: `programme:${programme.id}`, label: `${def.name} is off track`, material: false })
  }
  const strain = teamStrain(state)
  if (strain > 0.85) {
    out.push({ id: 'team:capacity', label: 'The cyber team is beyond sustainable load', material: true })
  }
  return out
}

export function buildQuarterReview(
  state: GameState,
  index: ContentIndex,
  input: QuarterReviewInput,
): QuarterReviewOutput {
  const topics = materialTopics(state, index)
  const materialIds = topics.filter((t) => t.material).map((t) => t.id)
  const covered = materialIds.filter((id) => input.topics.includes(id))
  const missed = materialIds.filter((id) => !input.topics.includes(id))
  const noise = input.topics.filter((id) => !materialIds.includes(id))

  const effects: GameEffect[] = []
  let reaction: string

  const coverage = materialIds.length === 0 ? 1 : covered.length / materialIds.length

  if (missed.length > 0) {
    // Surprising the board with a known material risk is the classic failure.
    effects.push({ type: 'board.confidence', delta: -0.06 * missed.length })
    reaction = `The board accepted the papers, but ${missed.length} material item${missed.length === 1 ? ' was' : 's were'} not on the agenda. They will find out another way.`
  } else if (noise.length > 2) {
    effects.push({ type: 'board.confidence', delta: -0.02 })
    reaction = 'The board sat through a long list. The chair asks you to bring fewer, sharper items next time.'
  } else {
    effects.push({ type: 'board.confidence', delta: 0.05 + 0.05 * coverage })
    reaction = 'The board follows the argument and supports the direction you set out.'
  }

  if (input.communicateUncertainty) {
    // Honest uncertainty, communicated well, builds durable credibility.
    const understanding = state.organisation.understanding['overall'] ?? 0
    if (understanding < 0.5) {
      effects.push({ type: 'board.confidence', delta: 0.03 })
      reaction += ' Your candour about what you do not yet know lands well.'
    } else {
      effects.push({ type: 'board.confidence', delta: 0.02 })
    }
  }

  for (const recommendationId of input.recommendations) {
    if (recommendationId.startsWith('programme:')) {
      const programmeId = recommendationId.slice('programme:'.length)
      const def = index.programme.get(programmeId)
      if (def?.preferredSponsorId) {
        effects.push({
          type: 'stakeholder.trust',
          stakeholderId: def.preferredSponsorId,
          delta: 0.03,
          reason: `You recommended ${def.name} to the board.`,
        })
      }
    }
  }

  return {
    quarter: input.quarter,
    day: state.currentDay,
    topicsChosen: input.topics,
    recommendationIds: input.recommendations,
    uncertaintyCommunicated: input.communicateUncertainty,
    boardReaction: reaction,
    completed: true,
    effects,
  }
}

function band(value: number): AnnualReviewDimension['band'] {
  if (value < 0.3) return 'weak'
  if (value < 0.52) return 'developing'
  if (value < 0.75) return 'solid'
  return 'strong'
}

export function buildAnnualReview(state: GameState, index: ContentIndex): AnnualReview {
  const dimensions: AnnualReviewDimension[] = []

  // 1. Risk understanding.
  const understanding = state.organisation.understanding['overall'] ?? 0
  const dependencies = state.organisation.understanding['dependencies'] ?? 0
  const assessedControls = Object.values(state.controls.controls).filter(
    (c) => c.believed && state.currentDay - c.believed.assessedOnDay < 200,
  ).length
  const controlAssurance = index.content.controls.length
    ? assessedControls / index.content.controls.length
    : 0
  const understandingScore = clamp01(0.45 * understanding + 0.3 * dependencies + 0.25 * controlAssurance)
  dimensions.push({
    id: 'risk-understanding',
    label: 'Risk understanding',
    band: band(understandingScore),
    narrative:
      understandingScore > 0.6
        ? 'You built a genuine picture of how Nexora actually works, and you tested it rather than trusting the inherited register.'
        : understandingScore > 0.35
          ? 'You understood parts of the organisation well and left others to assumption.'
          : 'You spent the year acting on an inherited picture you never verified.',
    evidence: [
      `${Math.round(understanding * 100)}% of the estate was brought into view`,
      `${assessedControls} of ${index.content.controls.length} controls were independently assessed`,
    ],
  })

  // 2. Prioritisation.
  const decisions = state.history.decisionsLog.length
  const withRationale = state.history.decisionsLog.filter((d) => d.rationaleTagIds.length > 0).length
  const lapsed = Object.values(state.decisions.decisions).filter((d) => d.resolvedByDefault).length
  const prioritisation = clamp01(
    0.5 * (decisions > 0 ? withRationale / decisions : 0) + 0.5 * (1 - clamp01(lapsed / Math.max(4, decisions))),
  )
  dimensions.push({
    id: 'prioritisation',
    label: 'Prioritisation',
    band: band(prioritisation),
    narrative:
      lapsed === 0
        ? 'You made your choices deliberately and on time, and recorded why.'
        : `${lapsed} decision${lapsed === 1 ? '' : 's'} lapsed and the organisation chose for you.`,
    evidence: [`${withRationale} of ${decisions} decisions carried a recorded rationale`],
  })

  // 3. Resilience.
  const incidents = Object.values(state.incidents.incidents)
  const worstConsequence = incidents.reduce((max, i) => Math.max(max, i.consequence), 0)
  const resilience = clamp01(1 - worstConsequence * 0.8)
  dimensions.push({
    id: 'resilience',
    label: 'Resilience',
    band: band(resilience),
    narrative:
      incidents.length === 0
        ? 'No material incident reached the business this year. Whether that was capability or fortune is worth asking.'
        : worstConsequence > 0.5
          ? 'When the organisation was tested, the consequences ran well beyond what the business could absorb comfortably.'
          : 'The organisation was tested and absorbed it without lasting damage.',
    evidence: incidents.map((i) => {
      const family = index.incidentFamily.get(i.familyId)
      return `${family?.name ?? 'Incident'} on day ${i.startedDay}`
    }),
  })

  // 4. Programme execution.
  const programmes = Object.values(state.programmes.programmes)
  const started = programmes.filter((p) => p.status !== 'proposed')
  const completed = programmes.filter((p) => p.status === 'complete')
  const execution = clamp01(started.length === 0 ? 0 : (completed.length + 0.4 * (started.length - completed.length)) / started.length)
  dimensions.push({
    id: 'programme-execution',
    label: 'Cyber programme execution',
    band: band(execution),
    narrative:
      started.length === 0
        ? 'You started no capability programme. Nexora ends the year with the controls it had when you arrived, minus drift.'
        : `${completed.length} of ${started.length} programmes you started reached completion.`,
    evidence: started.map((p) => {
      const def = index.programme.get(p.id)
      return `${def?.shortName ?? p.id}: ${Math.round(p.progress * 100)}% delivered`
    }),
  })

  // 5. Business enablement.
  const objectives = Object.values(state.business.objectives)
  const achieved = objectives.filter((o) => o.status === 'achieved').length
  const failed = objectives.filter((o) => o.status === 'failed').length
  const enablement = clamp01(objectives.length === 0 ? 0.5 : achieved / objectives.length)
  dimensions.push({
    id: 'business-enablement',
    label: 'Business enablement',
    band: band(enablement),
    narrative:
      failed === 0
        ? 'The business met its commitments with security alongside it rather than in the way.'
        : `${failed} business objective${failed === 1 ? '' : 's'} were missed. Some of that was security friction you chose to impose.`,
    evidence: index.content.objectives.map((def) => {
      const runtime = state.business.objectives[def.id]
      return `${def.name}: ${runtime?.status ?? 'unknown'}`
    }),
  })

  // 6. Communication and escalation.
  const quarters = state.reviews.quarters
  const boardConfidence = state.stakeholders.boardConfidence
  const communication = clamp01(0.6 * boardConfidence + 0.4 * clamp01(quarters.length / 3))
  dimensions.push({
    id: 'communication',
    label: 'Communication and escalation',
    band: band(communication),
    narrative:
      boardConfidence > 0.65
        ? 'The board came to rely on your judgement, including when you told them what you did not know.'
        : boardConfidence > 0.4
          ? 'The board listened, but never quite came to depend on you.'
          : 'The board ended the year unsure whether they were hearing the whole picture.',
    evidence: [`${quarters.length} quarterly reviews prepared`],
  })

  // 7. Team sustainability.
  const strain = teamStrain(state)
  const morale =
    Object.values(state.team.functions).reduce((sum, fn) => sum + fn.morale, 0) /
    Math.max(1, Object.values(state.team.functions).length)
  const sustainability = clamp01(0.55 * morale + 0.45 * (1 - strain))
  dimensions.push({
    id: 'team-sustainability',
    label: 'Team sustainability',
    band: band(sustainability),
    narrative:
      morale > 0.6
        ? 'Your team ends the year in a state where they could do this again next year.'
        : 'Your team carried the year on goodwill that has now run out.',
    evidence: Object.values(state.team.functions).map(
      (fn) => `${fn.fn}: ${Math.round(fn.morale * 100)}% morale, ${fn.vacancies} vacancies`,
    ),
  })

  const spots = blindSpots(state, index)
  // Relying on something untrue for a year without ever checking is the purest
  // blind spot the simulation can identify, so it is named explicitly.
  for (const assumption of unexaminedAssumptions(state)) {
    spots.unshift(`you relied on "${assumption.statement}" all year without ever testing it, and it was not true`)
  }
  dimensions.push({
    id: 'blind-spots',
    label: 'Material blind spots',
    band: band(clamp01(1 - spots.length / 6)),
    narrative:
      spots.length === 0
        ? 'Nothing material was left unexamined.'
        : `Material parts of Nexora were never brought into view: ${spots.slice(0, 3).join('; ')}.`,
    evidence: spots,
  })

  const overall = dimensions.reduce((sum, d) => sum + bandValue(d.band), 0) / dimensions.length
  const performanceBand =
    overall > 0.78 ? 'Exceptional first year' : overall > 0.6 ? 'Credible first year' : overall > 0.42 ? 'Mixed first year' : 'Difficult first year'

  const worstRisk = Object.values(state.risks.scenarios)
    .filter((s) => s.lastAssessed)
    .sort((a, b) => (b.lastAssessed?.residual ?? 0) - (a.lastAssessed?.residual ?? 0))[0]
  const worstRiskDef = worstRisk ? index.riskScenario.get(worstRisk.id) : undefined

  const narrative: string[] = []
  narrative.push(
    understandingScore > 0.55
      ? 'You spent your first months finding out how Nexora actually works rather than reacting to the inherited backlog.'
      : 'You inherited a backlog and largely worked it, which left the shape of the organisation itself unexamined.',
  )
  if (started.length > 0) {
    const lead = started.slice().sort((a, b) => b.progress - a.progress)[0]
    const leadDef = lead ? index.programme.get(lead.id) : undefined
    if (leadDef) {
      narrative.push(
        `Your clearest investment was ${leadDef.name}, which ended the year ${Math.round((lead?.progress ?? 0) * 100)}% delivered.`,
      )
    }
  } else {
    narrative.push('You built no new capability, so Nexora ends the year weaker than it started through drift alone.')
  }
  if (incidents.length > 0) {
    const worst = incidents.slice().sort((a, b) => b.consequence - a.consequence)[0]
    const family = worst ? index.incidentFamily.get(worst.familyId) : undefined
    if (family && worst) {
      narrative.push(
        `${family.name} tested the organisation on day ${worst.startedDay}. ${worst.reconstruction?.narrative ?? ''}`.trim(),
      )
    }
  }
  if (worstRiskDef && worstRisk) {
    narrative.push(
      `You end the year with ${worstRiskDef.title} at ${riskBand(worstRisk.lastAssessed?.residual ?? 0)} residual exposure and ${worstRisk.confidence} confidence.`,
    )
  }
  if (spots.length > 0) {
    narrative.push(`What you never looked at: ${spots.slice(0, 2).join('; ')}.`)
  }

  const businessOutcome =
    failed === 0
      ? `Nexora met all ${objectives.length} of its stated objectives.`
      : `Nexora met ${achieved} of ${objectives.length} objectives; ${failed} were missed.`

  return {
    day: state.currentDay,
    dimensions,
    narrative,
    headline:
      incidents.length === 0 && enablement > 0.6
        ? 'A quiet year that bought the organisation real capability.'
        : incidents.length > 0 && resilience > 0.6
          ? 'Tested, and it held.'
          : 'A year that exposed what was never understood.',
    performanceBand,
    businessOutcome,
    blindSpots: spots,
  }
}

function bandValue(band: AnnualReviewDimension['band']): number {
  switch (band) {
    case 'weak':
      return 0.2
    case 'developing':
      return 0.45
    case 'solid':
      return 0.68
    default:
      return 0.88
  }
}
