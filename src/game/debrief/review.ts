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
import { ASSURANCE_LIFE_DAYS, blindSpots, unexaminedMaterial } from '../knowledge/discovery'
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
    (c) => c.believed && state.currentDay - c.believed.assessedOnDay < ASSURANCE_LIFE_DAYS,
  ).length
  // What the player established themselves, weighted above what they inherited:
  // the register they were handed counts for something, but a year of taking it
  // on trust is not understanding, and scoring it as such made this dimension
  // read the same however hard the player looked.
  const examined = unexaminedMaterial(state, index)
  const examinedShare = examined.reachable > 0 ? examined.examined / examined.reachable : 0
  const understandingScore = clamp01(0.3 * understanding + 0.2 * dependencies + 0.5 * examinedShare)
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
      `${examined.examined} of ${examined.reachable} things you could have examined yourself, you did`,
      `${assessedControls} of ${index.content.controls.length} controls were independently assessed`,
    ],
  })

  // 2. Prioritisation.
  //
  // Deciding is only half of it: a choice taken on the deadline day, when the
  // option has already been overtaken, is not the same as one taken while it
  // still had room to matter. Scoring lapses alone made this dimension binary —
  // everything or nothing — because letting more than half a year's decisions
  // go by default is the only way to fail it.
  const allDecisions = Object.values(state.decisions.decisions)
  const lapsed = allDecisions.filter((d) => d.resolvedByDefault).length
  const resolved = allDecisions.filter((d) => !d.resolvedByDefault && d.resolvedDay !== undefined)
  // Over the choices the player actually made. The decisions log records
  // lapses too, and they carry no rationale by definition, so counting against
  // it charged a player twice for the same lapse.
  const withRationale = resolved.filter((d) => d.rationaleTagIds.length > 0).length
  const inGoodTime = resolved.filter((d) => {
    if (d.deadlineDay === undefined) return true
    const window = d.deadlineDay - d.createdDay
    if (window <= 0) return false
    // Room to spare means a third of the window still left when it was taken.
    return (d.deadlineDay - (d.resolvedDay ?? d.deadlineDay)) / window >= 0.33
  }).length
  const put = resolved.length + lapsed
  // Composed rather than averaged, because these compound: a weighted sum lets
  // a perfect rationale record carry a player who let four decisions in ten go
  // by default. Letting the organisation choose for you is the failure this
  // dimension exists to name, so it scales everything else.
  const decidedTerm = Math.max(0, 1 - 1.6 * (put > 0 ? lapsed / put : 1))
  const timelyTerm = resolved.length > 0 ? inGoodTime / resolved.length : 0
  const recordedTerm = resolved.length > 0 ? withRationale / resolved.length : 0
  const prioritisation = clamp01(decidedTerm * (0.5 + 0.5 * timelyTerm) * (0.8 + 0.2 * recordedTerm))
  dimensions.push({
    id: 'prioritisation',
    label: 'Prioritisation',
    band: band(prioritisation),
    narrative:
      lapsed === 0 && inGoodTime === resolved.length
        ? 'You made your choices deliberately and with room to spare, and recorded why.'
        : lapsed === 0
          ? `You answered everything put to you, though ${resolved.length - inGoodTime} of ${resolved.length} went to the wire.`
          : `${lapsed} decision${lapsed === 1 ? '' : 's'} lapsed and the organisation chose for you.`,
    evidence: [
      `${withRationale} of ${resolved.length} decisions you took carried a recorded rationale`,
      `${inGoodTime} of ${resolved.length} were taken while there was still time to act on them`,
    ],
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
  // Things taken on trust sit behind things never seen at all: both are blind
  // spots, but not knowing something exists is the worse of the two.
  spots.push(...examined.names)
  // Relying on something untrue for a year without ever checking is the purest
  // blind spot the simulation can identify, so it is named explicitly.
  for (const assumption of unexaminedAssumptions(state)) {
    spots.unshift(`you relied on "${assumption.statement}" all year without ever testing it, and it was not true`)
  }
  dimensions.push({
    id: 'blind-spots',
    label: 'Material blind spots',
    // Scored against how much there was to find, so a big estate is not
    // penalised for being big, and the dimension actually discriminates.
    band: band(clamp01(examinedShare - unexaminedAssumptions(state).length * 0.08)),
    narrative:
      spots.length === 0
        ? 'Nothing material was left unexamined.'
        : `Material parts of Nexora were never brought into view: ${spots.slice(0, 3).join('; ')}.`,
    evidence: spots.slice(0, 12),
  })

  const overall = dimensions.reduce((sum, d) => sum + bandValue(d.band), 0) / dimensions.length
  const headline = chooseHeadline(dimensions, incidents.length > 0)
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
    headline,
    performanceBand,
    businessOutcome,
    blindSpots: spots,
  }
}

/**
 * The closing line describes the shape of the year, not its average.
 *
 * Two players can end on the same overall band having run completely different
 * organisations — one that built capability at the cost of delivery, one that
 * delivered everything on a team that is now finished. A single line keyed on
 * incident count could not tell them apart, so the headline is chosen from the
 * dimensions that actually diverged: the strongest, the weakest, and the
 * tension between them.
 */
export function chooseHeadline(dimensions: AnnualReviewDimension[], hadIncident: boolean): string {
  const score = (id: string) => {
    const dimension = dimensions.find((d) => d.id === id)
    return dimension ? bandValue(dimension.band) : 0.5
  }
  const strong = (id: string) => score(id) >= 0.68
  const weak = (id: string) => score(id) <= 0.45

  const resilience = score('resilience')
  const business = score('business-enablement')
  const programme = score('programme-execution')
  const understanding = score('risk-understanding')
  const team = score('team-sustainability')

  const weakest = dimensions.reduce((lowest, d) => (bandValue(d.band) < bandValue(lowest.band) ? d : lowest))

  const failing = (id: string) => dimensions.find((d) => d.id === id)?.band === 'weak'

  // Trade-offs first. A tension between two dimensions says more about how
  // somebody played than any single score does, and it is what separates two
  // players who finished on the same overall band. Single-dimension verdicts
  // follow, and only when they are severe — otherwise one common failure would
  // describe nearly every year.
  if (strong('business-enablement') && weak('programme-execution')) {
    return 'The business got its year. The security programme did not.'
  }
  if (strong('programme-execution') && weak('business-enablement')) {
    return 'You built the capability, and the business paid for it in delivery.'
  }
  if (strong('risk-understanding') && weak('programme-execution')) {
    return 'You came to understand this organisation. You have not yet changed it.'
  }
  if (strong('programme-execution') && failing('team-sustainability')) {
    return 'You built the capability on people who cannot do it again.'
  }
  if (hadIncident && strong('resilience')) return 'Tested, and it held.'
  if (failing('team-sustainability')) return 'Delivered on the backs of people who cannot do it again.'
  if (hadIncident && weakest.id === 'resilience') return 'Tested, and it did not hold.'
  if (failing('blind-spots')) return 'A year spent acting on a picture you never verified.'
  if (weak('risk-understanding')) return 'A year of decisions taken on an inherited picture.'
  if (strong('communication') && strong('risk-understanding')) {
    return 'You made cyber risk legible to the people who decide.'
  }
  if (!hadIncident && business >= 0.68 && programme >= 0.68) {
    return 'A quiet year that bought the organisation real capability.'
  }
  if (!hadIncident) return 'A quiet year. Whether that was judgement or fortune is worth asking.'

  // Nothing stood out: name the weakest thing, which is still informative.
  const shape = [resilience, business, programme, understanding, team]
  const spread = Math.max(...shape) - Math.min(...shape)
  return spread < 0.2
    ? 'A year of competent, unremarkable management.'
    : `A year held back by ${weakest.label.toLowerCase()}.`
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
