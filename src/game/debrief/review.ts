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
  ReasoningLine,
} from '../types'
import { clamp01 } from '../types'
import { ASSURANCE_LIFE_DAYS, blindSpots, unexaminedMaterial } from '../knowledge/discovery'
import { unexaminedAssumptions } from '../assumptions/validation'
import { compareBands, riskBand } from '../risk/bands'
import { moraleLabel, teamStrain } from '../team/capacity'

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
    // Materiality read in bands rather than against a number picked out of the
    // middle of one. Residual alone said nothing was material in 78% of board
    // packs for a player who investigated, decided and raised — more often
    // than for one who did nothing, because their own work pushed residual
    // under the bar and took the risk off the agenda. "Choose material
    // topics" (plan §28.7) needs something to choose between.
    const residual = riskBand(scenario.lastAssessed?.residual ?? 0)
    const consequence = riskBand(scenario.lastAssessed?.consequence ?? 0)
    const material =
      compareBands(residual, 'elevated') >= 0 ||
      // A severe-consequence risk you believe you have controlled is exactly
      // what a board needs to know you are relying on.
      compareBands(consequence, 'elevated') >= 0 ||
      // Accepting risk is done on the organisation's behalf, so the
      // organisation hears about it.
      scenario.status === 'accepted'
    out.push({ id: `risk:${scenario.id}`, label: def.title, material })
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

/**
 * The reasons the player gave, and whether the year bore them out.
 *
 * A count of how many choices carried a rationale says nothing about whether
 * the reasoning was any good. This joins each rationale to what happened next:
 * a risk carried as "within tolerance" that reached the business anyway, an
 * assurance assumption recorded beside a choice that later turned out not to
 * hold. It is the question the whole game is asking, so the debrief should put
 * it to the player in their own words rather than in a score.
 */
export function reasoningReview(state: GameState, index: ContentIndex): ReasoningLine[] {
  const tally = new Map<string, { uses: number; materialised: number; assumptionsFailed: number }>()
  // Counted as occasions, not incidents: a choice contradicted by three of its
  // assumptions is one occasion where the reasoning did not hold, so the tallies
  // stay readable against the number of times the reasoning was used.
  const bump = (tagId: string, field: 'uses' | 'materialised' | 'assumptionsFailed') => {
    const row = tally.get(tagId) ?? { uses: 0, materialised: 0, assumptionsFailed: 0 }
    row[field] += 1
    tally.set(tagId, row)
  }

  const incidentPaths = new Set(
    Object.values(state.incidents.incidents)
      .map((incident) => incident.pathId)
      .filter((pathId): pathId is string => Boolean(pathId)),
  )
  const assumptions = Object.values(state.assumptions.assumptions)

  // Choices the player took themselves. A lapsed decision carries no reasoning
  // by definition, so it is not evidence about any rationale.
  for (const decision of Object.values(state.decisions.decisions)) {
    if (decision.resolvedByDefault || decision.resolvedDay === undefined) continue
    const failedHere = assumptions.filter(
      (assumption) => assumption.linkedDecisionId === decision.id && assumption.status === 'invalidated',
    ).length
    for (const tagId of decision.rationaleTagIds) {
      bump(tagId, 'uses')
      if (failedHere > 0) bump(tagId, 'assumptionsFailed')
    }
  }

  // Risks the player decided to carry, and what became of them.
  for (const entry of state.history.entries) {
    if (entry.kind !== 'risk-accepted') continue
    const [scenarioId, ...tagIds] = entry.refs ?? []
    if (!scenarioId || tagIds.length === 0) continue
    const def = index.riskScenario.get(scenarioId)
    const scenario = state.risks.scenarios[scenarioId]
    const realised = Boolean(def?.attackPathIds.some((pathId) => incidentPaths.has(pathId)))
    const failedHere = (scenario?.assumptionIds ?? []).filter(
      (id) => state.assumptions.assumptions[id]?.status === 'invalidated',
    ).length
    for (const tagId of tagIds) {
      bump(tagId, 'uses')
      if (realised) bump(tagId, 'materialised')
      if (failedHere > 0) bump(tagId, 'assumptionsFailed')
    }
  }

  const lines: ReasoningLine[] = []
  for (const [tagId, row] of tally) {
    const label = index.rationaleTag.get(tagId)?.label ?? tagId
    const times = `${row.uses} time${row.uses === 1 ? '' : 's'}`
    let verdict: string
    if (row.materialised > 0 && row.assumptionsFailed > 0) {
      verdict = `You leaned on this ${times}. On ${row.materialised} the risk you carried reached the business anyway, and on ${row.assumptionsFailed} the assurance underneath it turned out not to hold.`
    } else if (row.materialised > 0) {
      verdict = `You leaned on this ${times}. On ${row.materialised} of them the risk you carried reached the business anyway.`
    } else if (row.assumptionsFailed > 0) {
      verdict = `You leaned on this ${times}. On ${row.assumptionsFailed} of them the assurance underneath it turned out not to hold.`
    } else {
      // Deliberately not "it was right": nothing contradicting a belief is not
      // the same as the belief having been tested.
      verdict = `You leaned on this ${times}, and nothing this year contradicted it.`
    }
    lines.push({ tagId, label, uses: row.uses, materialised: row.materialised, assumptionsFailed: row.assumptionsFailed, verdict })
  }

  // Contradicted reasoning first: it is the part worth reading.
  return lines
    .sort((a, b) => {
      const weight = (line: ReasoningLine) => line.materialised * 10 + line.assumptionsFailed
      return weight(b) - weight(a) || b.uses - a.uses
    })
    .slice(0, 6)
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
    // Led by the band it sits beside. Picking the sentence from its own
    // thresholds produced "STRONG — 3 decisions lapsed and the organisation
    // chose for you": a verdict and an explanation that contradict each other,
    // and the player reads the sentence.
    narrative: (() => {
      const lapses = lapsed === 0 ? '' : ` ${lapsed} lapsed and the organisation chose ${lapsed === 1 ? 'that one' : 'those'} for you.`
      const late = resolved.length - inGoodTime
      switch (band(prioritisation)) {
        case 'strong':
          return lapsed === 0 && late === 0
            ? 'You made your choices deliberately and with room to spare, and recorded why.'
            : `You answered what was put to you in good time and recorded why.${lapses}`
        case 'solid':
          return late > 0
            ? `You answered what was put to you, though ${late} of ${resolved.length} went to the wire.${lapses}`
            : `You answered what was put to you and recorded why.${lapses}`
        case 'developing':
          return `Too much went to the wire, and${lapsed === 0 ? ' some of it was decided in a hurry.' : lapses}`
        default:
          return lapsed === 0
            ? 'You left your choices until the last moment all year.'
            : `${lapsed} decision${lapsed === 1 ? '' : 's'} lapsed and the organisation chose for you.`
      }
    })(),
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
    // Band-led, for the same reason: this read "STRONG — the board listened,
    // but never quite came to depend on you."
    narrative: (() => {
      switch (band(communication)) {
        case 'strong':
          return 'The board came to rely on your judgement, including when you told them what you did not know.'
        case 'solid':
          return 'The board followed your argument, and took what you brought them seriously.'
        case 'developing':
          return 'The board listened, but never quite came to depend on you.'
        default:
          return 'The board ended the year unsure whether they were hearing the whole picture.'
      }
    })(),
    evidence: [`${quarters.length} quarterly reviews prepared`],
  })

  // 7. Team sustainability.
  //
  // Leaning on the worst function, not the average of all of them. A flat mean
  // let one function sit at nothing while the others carried the score: the
  // review called a team "strong" and able to do it again next year with its
  // architects at zero morale. A team is as sustainable as the part of it that
  // is closest to walking out.
  const strain = teamStrain(state)
  const functions = Object.values(state.team.functions)
  const meanMorale = functions.reduce((sum, fn) => sum + fn.morale, 0) / Math.max(1, functions.length)
  const worstMorale = functions.reduce((lowest, fn) => Math.min(lowest, fn.morale), 1)
  const morale = 0.45 * meanMorale + 0.55 * worstMorale
  const spent = functions.filter((fn) => fn.morale < 0.25)
  // A cap, not a penalty. Weighting the worst function was not enough on its
  // own: a team with two functions at nothing still read "solid" because
  // nobody happened to be overloaded on the last day of the year, and a
  // low-strain term carried the score. You cannot call a team sustainable when
  // part of it is finished, however rested the rest of it looks.
  const ceiling = spent.length >= 2 ? 0.29 : spent.length === 1 ? 0.51 : 1
  const sustainability = Math.min(ceiling, clamp01(0.55 * morale + 0.45 * (1 - strain)))
  dimensions.push({
    id: 'team-sustainability',
    label: 'Team sustainability',
    band: band(sustainability),
    narrative:
      spent.length > 0
        ? `Your ${spent.map((fn) => fn.fn).join(' and ')} ${spent.length === 1 ? 'function is' : 'functions are'} spent. The rest of the team cannot cover that indefinitely.`
        : morale > 0.6
          ? 'Your team ends the year in a state where they could do this again next year.'
          : 'Your team carried the year on goodwill that has now run out.',
    // Words rather than percentages: morale is an internal 0..1 and the game
    // does not render internal numbers.
    evidence: functions.map(
      (fn) =>
        `${fn.fn}: ${moraleLabel(fn.morale).toLowerCase()}${
          fn.vacancies > 0 ? `, ${fn.vacancies} ${fn.vacancies === 1 ? 'vacancy' : 'vacancies'}` : ', fully staffed'
        }`,
    ),
  })

  const spots = blindSpots(state, index)
  // Things taken on trust sit behind things never seen at all: both are blind
  // spots, but not knowing something exists is the worse of the two.
  spots.push(...examined.names)
  // A year's worth of these runs to thirty lines and stops being read. The
  // dimension keeps the count; the list names the worst of them.
  spots.splice(12)
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
    reasoning: reasoningReview(state, index),
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
