/**
 * The quarterly board paper (plan §26): what is material enough to take to the
 * committee, and how the committee reads what it was given.
 *
 * Kept apart from the annual review (`./review.ts`), which only the year's end
 * needs: the board paper is part of every quarter, so it loads with the game,
 * and the annual review loads with the screen that shows it.
 */
import { formatGameDate } from '../time'
import type { ContentIndex, GameEffect, GameState, QuarterReviewState } from '../types'
import { compareBands, consequenceBand, residualBand } from '../risk/bands'
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
    // It said which items were missing but not which were surplus, so a
    // player who had covered everything could not tell what to leave out.
    const surplus = noise.map((id) => topics.find((t) => t.id === id)?.label ?? id)
    reaction = `The board sat through a long list. ${surplus.slice(0, -1).join(', ')} and ${surplus.at(-1)} did not need its time this quarter; the chair asks for fewer, sharper items next time.`
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
