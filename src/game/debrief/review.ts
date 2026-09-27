/**
 * Quarterly board reviews and the annual CISO review (plan §26).
 *
 * The output is narrative and multi-dimensional. A single score would teach the
 * wrong lesson, so the performance band is deliberately secondary.
 */
import { formatGameDate } from '../time'
import type {
  AnnualReview,
  AnnualReviewDimension,
  ContentIndex,
  GameEffect,
  GameState,
  QuarterReviewState,
  ReasoningLine,
} from '../types'
import { clamp01, money } from '../types'
import { ASSURANCE_LIFE_DAYS, blindSpots, unexaminedMaterial } from '../knowledge/discovery'
import { calculateControlEffectiveness } from '../controls/effectiveness'
import { effortAllocation } from './prioritisation'
import { unexaminedAssumptions } from '../assumptions/validation'
import { compareBands, consequenceBand, residualBand } from '../risk/bands'
import { functionName, moraleLabel, teamStrain } from '../team/capacity'

export interface QuarterReviewInput {
  quarter: number
  topics: string[]
  recommendations: string[]
  communicateUncertainty: boolean
}

export interface QuarterReviewOutput extends QuarterReviewState {
  effects: GameEffect[]
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
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
    const residual = residualBand(scenario.lastAssessed?.residual ?? 0)
    const consequence = consequenceBand(scenario.lastAssessed?.consequence ?? 0)
    const material =
      compareBands(residual, 'high') >= 0 ||
      // A severe-consequence risk you believe you have controlled is exactly
      // what a board needs to know you are relying on.
      compareBands(consequence, 'high') >= 0 ||
      // Accepting risk is done on the organisation's behalf, so the
      // organisation hears about it.
      scenario.status === 'accepted'
    out.push({ id: `risk:${scenario.id}`, label: def.title, material })
  }
  for (const incident of Object.values(state.incidents.incidents)) {
    const family = index.incidentFamily.get(incident.familyId)
    if (!family) continue
    // Two incidents of one family made two identical lines, which reads as a
    // duplicate rather than as the point. The date tells them apart.
    out.push({
      id: `incident:${incident.id}`,
      label: `${family.name} (incident, from ${formatGameDate(incident.startedDay).label})`,
      material: true,
    })
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
    // "One material item was not on the agenda" without saying which was
    // feedback nobody could act on; the third observed playthrough asked
    // twice. Name them.
    const names = missed.map((id) => topics.find((t) => t.id === id)?.label ?? id)
    reaction = `The board accepted the papers, but ${names.length === 1 ? 'one material item was' : `${names.length} material items were`} not on the agenda: ${names.join('; ')}. They will find out another way.`
  } else if (input.topics.length === 0 && materialIds.length === 0) {
    // A paper with nothing in it. Nothing was missed, so it is not the failure
    // above, but "coverage" of an empty agenda is not coverage: measured over
    // 20 campaigns, a player who raised nothing all year took three empty
    // papers to the board, was credited the full bump each time, and ended
    // the year at 0.62 confidence against 0.64 for one who raised and covered
    // everything. The board heard nothing and asks when it will.
    reaction = 'The board notes that nothing has yet been assessed. The chair asks what the quarter found, and when they will hear what it means.'
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

  // Kept with their days. Matching on the path alone let an incident on day 40
  // contradict an acceptance made on day 120 through the same path — which is
  // backwards: the later acceptance may have been made *because* of that
  // incident, after remediating it. Reasoning is judged against what happened
  // after it was relied on, never before.
  const incidentPathDays: { pathId: string; day: number }[] = Object.values(state.incidents.incidents)
    .filter((incident): incident is typeof incident & { pathId: string } => Boolean(incident.pathId))
    .map((incident) => ({ pathId: incident.pathId, day: incident.startedDay }))
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
    const realised = Boolean(
      def?.attackPathIds.some((pathId) =>
        incidentPathDays.some((i) => i.pathId === pathId && i.day >= entry.day),
      ),
    )
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
      // the same as the belief having been tested. Said once for the section
      // on the debrief rather than on every line, where six reasons read as six
      // copies of the same sentence.
      verdict = `You leaned on this ${times}.`
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

/**
 * How close a risk the player never worked on came to their attention. "It
 * was never on your list, because nothing brought it into view" was said of
 * a risk whose pattern the briefing had offered three months running; the
 * third observed playthrough saw it, and did not pursue it. Surfaced, formed,
 * dismissed and raised are different things and the review says which.
 */
function missedStanding(state: GameState, index: ContentIndex, scenarioId: string): string {
  if (state.risks.scenarios[scenarioId]) return ''
  const templates = index.content.hypothesisTemplates.filter((t) => t.linkedScenarioId === scenarioId)
  if (templates.some((t) => Object.values(state.risks.hypotheses).some((h) => h.templateId === t.id))) {
    return ' — you formed the hypothesis and never raised it as a risk'
  }
  if (templates.some((t) => (state.risks.dismissedPatternIds ?? []).includes(t.id))) {
    return ' — the game offered the pattern and you set it aside'
  }
  const knownTags = new Set(state.evidence.order.flatMap((id) => index.evidence.get(id)?.tags ?? []))
  if (templates.some((t) => t.requiresTags.every((tag) => knownTags.has(tag)))) {
    return ' — the evidence for it was in your hands and never became a pattern'
  }
  return ' — it was never on your list, because nothing brought it into view'
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
  let seenNodes = 0
  let existingNodes = 0
  for (const def of index.content.nodes) {
    const node = state.organisation.nodes[def.id]
    if (!node?.exists) continue
    existingNodes += 1
    if (node.discovered) seenNodes += 1
  }
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
      // A count, not a share of an internal aggregate. This line read "66% of
      // the estate was brought into view" — the same 0..1 understanding value
      // that was taken off the Briefing for being a rendered score — directly
      // above "0 of 32 things you could have examined yourself, you did",
      // which reads as a contradiction unless you already know the difference
      // between having seen something and having checked it.
      `${seenNodes} of ${existingNodes} systems were ever brought into view`,
      `${examined.examined} of ${examined.reachable} things you could have examined yourself, you did`,
      // Current and lapsed apart: "0 of 13 controls were independently
      // assessed" printed for a year that had assessed four of them, in
      // January, because only current assurance was counted.
      (() => {
        const everAssessed = Object.values(state.controls.controls).filter(
          (c) => c.believed && c.believed.assessedOnDay >= 0,
        ).length
        const total = index.content.controls.length
        return everAssessed > assessedControls
          ? `${everAssessed} of ${total} controls were independently assessed during the year, and the assurance on ${everAssessed - assessedControls} of them has since lapsed`
          : `${assessedControls} of ${total} controls were independently assessed`
      })(),
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
  // How much of the window a player used is deliberately not scored.
  //
  // The old rule wanted a third of it still unspent and charged everything
  // else as "late", which marks a player down for the thing the game keeps
  // asking them to do: find something out before committing. Softening it to
  // catch only the wire then made the term dead — measured over 20 campaigns
  // of a player who waits for the deadline every time, a decision resolved on
  // or after its deadline day happened **0.0 times a campaign in 0 of 20**,
  // because the deadline lapses the decision before it can be answered. There
  // is no "late" in this game: you answer, or the organisation answers for
  // you, and `decidedTerm` below already says which.
  const put = resolved.length + lapsed
  // Composed rather than averaged, because these compound: a weighted sum lets
  // a perfect rationale record carry a player who let four decisions in ten go
  // by default. Letting the organisation choose for you is the failure this
  // dimension exists to name, so it scales everything else.
  const decidedTerm = Math.max(0, 1 - 1.6 * (put > 0 ? lapsed / put : 1))
  const recordedTerm = resolved.length > 0 ? withRationale / resolved.length : 0
  // The dimension the plan actually names. Whether attention and money went to
  // what mattered, which none of the terms above establish.
  const effort = effortAllocation(state, index)
  // Bent so the middle of the range does not read as excellence. Passed
  // through flat, a player who commissioned all eighteen enquiries without
  // choosing between them landed on the `strong` boundary and fell either side
  // of it by seed — an undirected year reading as an exemplary one on half the
  // runs, and unreadably on the rest. The top band is for having aimed.
  const aim = Math.pow(effort.allocation, 1.4)
  const prioritisation = clamp01(decidedTerm * (0.32 + 0.68 * aim) * (0.9 + 0.1 * recordedTerm))
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
      // The most material thing the player's own work was aimed at. This used
      // to be the most material thing anything could have been aimed at, so a
      // year that built identity and recovery was told the build pipeline was
      // "among" what it committed to, beside a line saying the pipeline ended
      // at high residual. Every transcript read in grading said it.
      const biggest = [...effort.commitments].sort((a, b) => b.materiality - a.materiality)[0]?.scenarioTitle
      switch (band(prioritisation)) {
        case 'strong':
          return `What you committed to was what mattered${biggest ? `, ${biggest} among it` : ''}.${lapses}`
        case 'solid':
          return effort.missed
            ? `Most of your effort went where it counted, though ${effort.missed.title} never had any of it${missedStanding(state, index, effort.missed.id)}.${lapses}`
            : `Most of your effort went where it counted.${lapses}`
        case 'developing':
          return effort.commitments.length === 0
            ? `You answered what was put in front of you and started nothing of your own, so the year set your agenda.${lapses}`
            : `You committed to real work, but not to the largest things in front of you${effort.missed ? ` — ${effort.missed.title} went untouched` : ''}.${lapses}`
        default:
          return lapsed > 0
            ? `${lapsed} decision${lapsed === 1 ? '' : 's'} lapsed and the organisation chose for you.`
            : 'The year was spent on what arrived rather than on what mattered most.'
      }
    })(),
    evidence: (() => {
      const lines = [
        effort.commitments.length === 0
          ? 'You started no programme and commissioned no enquiry aimed at a risk'
          : `${effort.commitments.length} commitment${effort.commitments.length === 1 ? '' : 's'} of budget and attention, aimed at ${new Set(effort.commitments.map((c) => c.scenarioId)).size} of the risks in front of you`,
        `${withRationale} of ${resolved.length} decisions you took carried a recorded rationale`,
        lapsed === 0
          ? `you answered all ${resolved.length} of the decisions put to you`
          : `${lapsed} decision${lapsed === 1 ? '' : 's'} lapsed and were taken by default`,
      ]
      // Named, because "you prioritised badly" is not a finding a player can do
      // anything with. The biggest thing nobody went near is.
      if (effort.missed) lines.push(`${effort.missed.title} was among the largest risks you inherited, and nothing you did went near it`)
      return lines
    })(),
  })

  // 3. Resilience.
  //
  // Absence of an incident is an outcome, not evidence of capability. Scored
  // purely from the worst consequence, a year with no incident took the default
  // of zero and reached the maximum, so every quiet year read `strong` — while
  // the sentence printed beside it said "whether that was capability or fortune
  // is worth asking". The verdict answered the question the prose was still
  // asking, and in the player's favour.
  //
  // So the dimension now separates what was demonstrated from what merely did
  // not happen. A year that was tested is scored on how the organisation came
  // through it. A quiet year is scored on whether recovery was ever exercised
  // — a recovery test or an IR readiness exercise the player commissioned, and
  // recovery controls they established assurance over themselves — and is
  // capped below `strong` when it was not, because nothing demonstrated it.
  const incidents = Object.values(state.incidents.incidents)
  const worstConsequence = incidents.reduce((max, i) => Math.max(max, i.consequence), 0)

  const RECOVERY_EXERCISES = ['inv-recovery-test', 'inv-ir-readiness']
  const exercises = state.team.assignments.filter(
    (a) => a.status === 'complete' && RECOVERY_EXERCISES.includes(a.refId),
  )
  const recoveryControls = index.content.controls
    .filter((c) => c.category === 'recovery')
    .map((c) => state.controls.controls[c.id])
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
  // The player's own assurance, on the same terms as everywhere else: an
  // inherited assessment recorded before they arrived is not their examination.
  const selfAssured = recoveryControls.filter(
    (c) =>
      c.believed &&
      c.believed.assessedOnDay >= 0 &&
      state.currentDay - c.believed.assessedOnDay < ASSURANCE_LIFE_DAYS,
  )
  const recoveryCapability =
    recoveryControls.length === 0
      ? 0
      : recoveryControls.reduce(
          (sum, c) => sum + calculateControlEffectiveness(c),
          0,
        ) / recoveryControls.length

  const tested = incidents.length > 0
  const stillRunning = incidents.some((i) => i.phase !== 'closed')
  // A production restore taken in the fourth quarter is an exercise as much
  // as a commissioned test is; it is recorded as a flag by the decision.
  const restoreTaken = state.flags['recovery.tested'] === true
  const exercised = exercises.length > 0 || selfAssured.length > 0 || restoreTaken
  // The untested scale is capped below `strong`: a year nothing tested cannot
  // demonstrate the top band, however much was built. Within that it separates
  // four real years — nothing done, exercised but nothing to exercise, built but
  // never tested, and built and exercised. The first version multiplied the two
  // terms instead of adding them and put all four in `developing`, which is a
  // dial with no room to move.
  const UNTESTED_CEILING = 0.74
  const resilience = tested
    ? clamp01(1 - worstConsequence * 0.8)
    : Math.min(UNTESTED_CEILING, clamp01(0.18 + 0.75 * recoveryCapability + (exercised ? 0.14 : 0)))

  dimensions.push({
    id: 'resilience',
    label: 'Resilience',
    band: band(resilience),
    // Led by the band, as prioritisation is. Picked from its own threshold of
    // 0.5, a worst consequence of 0.52 scored `solid` and printed "ran well
    // beyond what the business could absorb" beside it; all three transcripts
    // read in grading showed the pair.
    // An incident still running on the last day has not been come through,
    // absorbed or recovered from, and its cost is still being counted.
    narrative: tested && stillRunning
      ? ({
          strong: 'The organisation was tested, with little lasting damage so far, but an incident was still running when the year was written up.',
          solid: 'The organisation was tested and has absorbed it so far, though not without cost, and an incident was still running when the year was written up.',
          developing: 'When the organisation was tested, it took real damage, and an incident was still running when the year was written up.',
          weak: 'When the organisation was tested, the consequences ran well beyond what the business could absorb, and an incident was still running when the year was written up.',
        } as const)[band(resilience)]
      : tested
      ? ({
          strong: 'The organisation was tested and came through with little lasting damage.',
          solid: 'The organisation was tested and absorbed it, though not without cost.',
          developing: 'When the organisation was tested, it took real damage before it recovered.',
          weak: 'When the organisation was tested, the consequences ran well beyond what the business could absorb.',
        } as const)[band(resilience)]
      : exercised
        ? 'No material incident reached the business this year. What recovery capability you did exercise is the only evidence you have that it would have held.'
        : 'No material incident reached the business this year, and recovery was never exercised. That is an outcome, not a demonstrated capability.',
    // Grouped by family, because the same kind of incident twice is not two
    // facts, it is one: the same door, still open. Listed flat it read as
    // three identical rows — "Customer data exposure on day 88", "…on day
    // 176", "…on day 300" — which looks like a duplicate rather than the
    // point the year was making.
    evidence: (() => {
      const byFamily = new Map<string, { day: number; pathId?: string }[]>()
      for (const i of incidents) {
        const name = index.incidentFamily.get(i.familyId)?.name ?? 'Incident'
        byFamily.set(name, [...(byFamily.get(name) ?? []), { day: i.startedDay, pathId: i.pathId }].sort((a, b) => a.day - b.day))
      }
      const lines = [...byFamily].map(([name, runs]) => {
        const days = runs.map((r) => r.day)
        if (days.length === 1) return `${name} on day ${days[0]}`
        const rest = days.slice(1)
        const list = rest.length === 1 ? `day ${rest[0]}` : `days ${rest.slice(0, -1).join(', ')} and ${rest.at(-1)}`
        // "The same weakness" only when it was the same way in. Two data
        // exposures by different routes read "the same weakness, still open"
        // here and "by a different route" in the story above it.
        const routes = new Set(runs.map((r) => r.pathId ?? 'unknown'))
        return routes.size === 1
          ? `${name} on day ${days[0]}, and again on ${list} — the same weakness, still open`
          : `${name} on day ${days[0]}, and again on ${list}, by ${routes.size === runs.length ? 'a different route each time' : 'more than one route'}`
      })
      // The dimension counted a production restore as an exercise; this line
      // did not, and said "never exercised" under a restore that came back in
      // three and a half hours. Found by the second observed playtest.
      // Attacks that gave up because a step held. Without this a control that
      // worked left no trace at all: the year it prevented read the same as a
      // year nobody tried. Only places the player has mapped are named.
      const held = state.threats.campaigns.filter((c) => c.heldAt)
      if (held.length > 0) {
        const places = [...new Set(held.map((c) => c.heldAt!))]
        const named = places.filter((id) => state.organisation.nodes[id]?.discovered).map((id) => index.node.get(id)?.name ?? id)
        const unmapped = places.length - named.length
        const where = [
          ...named,
          ...(unmapped > 0 ? [unmapped === 1 ? 'one place you had not mapped' : `${unmapped} places you had not mapped`] : []),
        ]
        lines.push(
          `${held.length} attack${held.length === 1 ? '' : 's'} gave up at a control that held, at ${where.length > 1 ? `${where.slice(0, -1).join(', ')} and ${where.at(-1)}` : where[0]}`,
        )
      }
      const exerciseCount = exercises.length + (restoreTaken ? 1 : 0)
      lines.push(
        exerciseCount > 0
          ? `${exerciseCount} recovery exercise${exerciseCount === 1 ? '' : 's'} completed${restoreTaken ? ', one of them a production restore' : ''}`
          : 'Recovery was never exercised',
      )
      lines.push(
        `${selfAssured.length} of ${recoveryControls.length} recovery controls carried assurance you established yourself`,
      )
      return lines
    })(),
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
  // Neither achieved nor failed: a year closed early, or a delay that carried
  // a target past the last day. "Met all five" used to count these as met.
  const pending = objectives.length - achieved - failed
  // An objective still in delivery is neither credit nor failure: half of each.
  const enablement = clamp01(objectives.length === 0 ? 0.5 : (achieved + pending * 0.5) / objectives.length)
  dimensions.push({
    id: 'business-enablement',
    label: 'Business enablement',
    band: band(enablement),
    // The friction a player chooses is the programmes they run: each one drags
    // on delivery while it is live. The sentence used to blame that friction
    // whatever the player did, including a year that built nothing, and read
    // "Some of that" against a single missed objective.
    narrative: (() => {
      if (failed === 0 && pending === 0) return 'The business met its commitments with security alongside it rather than in the way.'
      if (failed === 0) {
        return `No business objective was missed, and ${pending === 1 ? 'one was' : `${pending} were`} still in delivery when the year was written up.`
      }
      const missed = failed === 1 ? 'One business objective was missed.' : `${failed} business objectives were missed.`
      const built = Object.values(state.programmes.programmes).some((p) => p.status !== 'proposed')
      return built
        ? `${missed} Security programmes you chose to run were part of the pressure on ${failed === 1 ? 'it' : 'them'}.`
        : `${missed} None of it was friction you imposed: you ran no security programme.`
    })(),
    evidence: (() => {
      const lines = index.content.objectives.map((def) => {
        const runtime = state.business.objectives[def.id]
        return `${def.name}: ${runtime?.status ?? 'unknown'}`
      })
      // Money committed beyond the year. It used to disappear into the floor on
      // `budget.change`, which left a player who spent their reserve and then
      // took unfunded emergency support indistinguishable from one who had
      // planned for it.
      if (state.resources.unfundedCommitment > 0) {
        lines.push(
          `${money(state.resources.unfundedCommitment)} was committed beyond the cyber allocation and left for finance to fund`,
        )
      }
      return lines
    })(),
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
        ? `Your ${spent.map((fn) => functionName(fn.fn)).join(' and ')} ${spent.length === 1 ? 'function is' : 'functions are'} spent. The rest of the team cannot cover that indefinitely.`
        : morale > 0.6
          ? 'Your team ends the year in a state where they could do this again next year.'
          : 'Your team carried the year on goodwill that has now run out.',
    // Words rather than percentages: morale is an internal 0..1 and the game
    // does not render internal numbers.
    evidence: functions.map(
      (fn) =>
        `${sentenceCase(functionName(fn.fn))}: ${moraleLabel(fn.morale).toLowerCase()}${
          fn.vacancies > 0 ? `, ${fn.vacancies} ${fn.vacancies === 1 ? 'vacancy' : 'vacancies'}` : ', fully staffed'
        }`,
    ),
  })

  const spots = blindSpots(state, index)
  const neverSeen = spots.length
  const onTrust = examined.names.length
  // Things taken on trust sit behind things never seen at all: both are blind
  // spots, but not knowing something exists is the worse of the two.
  spots.push(...examined.names)
  // A year's worth of these runs to thirty lines and stops being read. The
  // dimension keeps the count; the list names the worst of them.
  spots.splice(12)
  // Relying on something untrue for a year without ever checking is the purest
  // blind spot the simulation can identify, so it is named explicitly.
  for (const assumption of unexaminedAssumptions(state, index)) {
    // Dated, because a test before the reliance does not count and the player
    // may well remember one: a year that ran a recovery test on day 139 and
    // began relying on backups on day 275 read "without ever testing it"
    // beside "1 recovery exercise completed".
    spots.unshift(`from day ${assumption.createdDay} you relied on "${assumption.statement}" and never tested it after that; it was not true`)
  }
  dimensions.push({
    id: 'blind-spots',
    label: 'Material blind spots',
    // Scored against how much there was to find, so a big estate is not
    // penalised for being big, and the dimension actually discriminates.
    band: band(clamp01(examinedShare - unexaminedAssumptions(state, index).length * 0.08)),
    // Counted here and named once, under "What you never looked at". The
    // screen used to show the same list four times: in the opening summary, in
    // this sentence, in this evidence and in its own section. And "never
    // brought into view" sat under "38 of 38 systems were ever brought into
    // view", because most of what it listed were dependencies and systems the
    // player knew of and never checked, not things they never saw.
    narrative:
      spots.length === 0
        ? 'Nothing material was left unexamined.'
        : neverSeen > 0
          ? 'Material parts of how Nexora fits together were never seen, and more were known about but never examined.'
          : 'You saw all of what mattered, but much of it was taken on trust rather than examined.',
    evidence: [
      ...(neverSeen > 0
        ? [`${neverSeen} material ${neverSeen === 1 ? 'system or dependency was' : 'systems and dependencies were'} never discovered`]
        : []),
      ...(onTrust > 0 ? [`${onTrust} ${onTrust === 1 ? 'was' : 'were'} known about but taken on trust`] : []),
      ...unexaminedAssumptions(state, index).map(
        (a) => `"${a.statement}" was relied on from day ${a.createdDay}, not tested after that, and not true`,
      ),
    ],
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
  // A year with nothing taken, commissioned or built was told "you worked
  // what was in front of you" beside a headline saying it was decided largely
  // without the player.
  const engaged =
    Object.values(state.decisions.decisions).some((d) => d.resolvedDay !== undefined && !d.resolvedByDefault) ||
    state.team.assignments.length > 0 ||
    Object.values(state.programmes.programmes).some((p) => p.status !== 'proposed')
  narrative.push(
    understandingScore > 0.55
      ? 'You spent your first months finding out how Nexora actually works rather than reacting to the inherited backlog.'
      : engaged
        ? 'You worked what was in front of you, and much of how the organisation fits together was never verified.'
        : 'You let the year run without you, and much of how the organisation fits together was never verified.',
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
      // The worst incident is narrated; the others were not mentioned at all.
      // A hand-played year with two ransomware incidents closed on a review
      // that spoke of one. The resilience evidence already groups repeats;
      // the story has to as well.
      const others = incidents.filter((i) => i.id !== worst.id).sort((a, b) => a.startedDay - b.startedDay)
      if (others.length > 0) {
        const described = others.map((i) => {
          const name = index.incidentFamily.get(i.familyId)?.name ?? 'an incident'
          if (i.familyId !== worst.familyId) return `${name} on day ${i.startedDay}`
          // Same kind again: the route says whether it was the same door.
          const sameRoute = !i.pathId || !worst.pathId || i.pathId === worst.pathId
          // The worst is narrated first whatever its date, so "again" pointed
          // backwards when the other came before it: "tested on day 358 ... the
          // same kind of incident again on day 198".
          if (i.startedDay < worst.startedDay) {
            return sameRoute
              ? `the same kind of incident earlier, on day ${i.startedDay}, through the same route — the weakness was still open when it came again`
              : `the same kind of incident earlier, on day ${i.startedDay}, by a different route`
          }
          return sameRoute
            ? `the same kind of incident again on day ${i.startedDay}, through the same route — the same weakness, still open`
            : `the same kind of incident again on day ${i.startedDay}, by a different route`
        })
        narrative.push(`It was not the only one: ${described.join('; ')}.`)
      }
    }
  }
  if (worstRiskDef && worstRisk) {
    narrative.push(
      `You end the year with ${worstRiskDef.title} at ${residualBand(worstRisk.lastAssessed?.residual ?? 0)} residual exposure and ${worstRisk.confidence} confidence.`,
    )
  }
  if (spots.length > 0) {
    narrative.push(`What you never looked at: ${spots.slice(0, 2).join('; ')}.`)
  }
  // The fourth quarter's own question: what organisation have you created,
  // and what did you decide to carry into next year?
  // The situation the year began in asked a question; the close answers it
  // from what happened, rather than naming the situation and moving on.
  const situation = state.situationId ? index.situation.get(state.situationId) : undefined
  if (situation?.id === 'sit-after-breach') {
    const again = incidents.filter((i) => i.familyId === 'fam-ransomware').sort((a, b) => a.startedDay - b.startedDay)
    narrative.push(
      again.length > 0
        ? `You arrived after a breach, to a board asking whether it could happen again. It did: ransomware again on day ${again[0]!.startedDay}.`
        : incidents.length > 0
          ? 'You arrived after a breach, to a board asking whether it could happen again. Not the same way: this year\'s incidents were of other kinds.'
          : 'You arrived after a breach, to a board asking whether it could happen again. This year, it did not.',
    )
  } else if (situation?.id === 'sit-new-money') {
    const started = Object.values(state.programmes.programmes).filter((p) => p.status !== 'proposed')
    const finished = started.filter((p) => p.status === 'complete').length
    narrative.push(
      started.length === 0
        ? `You were given ${money(situation.budgetDelta ?? 0)} more than your predecessor had, and started no programme with it.`
        : `You were given ${money(situation.budgetDelta ?? 0)} more than your predecessor had. ${started.length} programme${started.length === 1 ? ' was' : 's were'} started with it and ${finished} finished.`,
    )
  } else if (situation?.id === 'sit-tidy') {
    const improved = [...new Set(situation.setupEffects.flatMap((e) => ('controlId' in e ? [e.controlId] : [])))]
    const checked = improved.filter((id) => (state.controls.controls[id]?.believed?.assessedOnDay ?? -1) >= 0).length
    narrative.push(
      checked === 0
        ? `You inherited better controls than most, and took all ${improved.length} your predecessor had improved on trust.`
        : `You inherited better controls than most. Of the ${improved.length} your predecessor had improved, you checked ${checked} for yourself.`,
    )
  }

  const nextYear = state.flags['next-year.budget']
  if (nextYear === 'cut') {
    // The cut is only offered while no incident has happened, so one at the
    // close came afterwards: "nothing happened this year" beside "tested the
    // organisation on day 347" was the review contradicting itself.
    narrative.push(
      incidents.length > 0
        ? 'In the autumn, with nothing yet having happened, you agreed to start next year with a fifth less. The year did not stay quiet.'
        : 'Nothing happened this year, so you agreed to start next year with a fifth less. Whether the quiet was capability or fortune is the question the cut assumes an answer to.',
    )
  } else if (nextYear === 'held') {
    narrative.push('When finance read a quiet year as a case for less, you argued it was capability rather than fortune, and kept the line. Next year will test the argument.')
  } else if (nextYear === 'trimmed') {
    narrative.push('You gave finance a named line back and kept the rest: a smaller cut, on terms you could explain.')
  }
  if (state.flags['recovery.deferred'] === true) {
    narrative.push('The recovery capability you built went into peak trading untested, on the assumption it would hold. It was not asked to.')
  }

  const businessOutcome =
    achieved === objectives.length
      ? `Nexora met all ${objectives.length} of its stated objectives.`
      : [
          `Nexora met ${achieved} of ${objectives.length} objectives`,
          failed > 0 ? `${failed} ${failed === 1 ? 'was' : 'were'} missed` : undefined,
          pending > 0 ? `${pending} ${pending === 1 ? 'was' : 'were'} still in delivery` : undefined,
        ]
          .filter(Boolean)
          .join('; ') + '.'

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

  const failing = (id: string) => dimensions.find((d) => d.id === id)?.band === 'weak'

  const weakest = dimensions.reduce((lowest, d) => (bandValue(d.band) < bandValue(lowest.band) ? d : lowest))

  // A trade-off is something the player made. Somebody who let the decisions
  // go by default did not choose the business over the programme; they were
  // not there. Reading the tension first told a player who lapsed 16 of 18
  // decisions that "the business got its year", crediting them with a
  // judgement the prioritisation line directly contradicts.
  // `weak()` here means "weak or developing", which is too broad for this:
  // only the weak band requires having ignored a third of what was put to you.
  if (failing('prioritisation')) {
    return 'The year was decided largely without you.'
  }

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
