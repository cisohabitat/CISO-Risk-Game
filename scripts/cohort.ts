/**
 * `pnpm cohort [count] [mode] [prefix] [situation]`
 *
 * What each of a run of seeds holds, for choosing the seeds a class plays
 * (docs/educator/FACILITATOR.md, Phase 6 of docs/ROADMAP.md). Each seed is
 * played as a light, engaged year — answer what is asked, take what the game
 * notices, file each paper, read the inbox, run the identity programme from
 * day 25, commission two enquiries — and reported by what it met.
 *
 * The seed fixes the hidden world: the awkward dependencies, how good the
 * controls really are, what the executives are like. What happens in it also
 * depends on what the player does, so this is what a student playing roughly
 * this way will meet, not a promise of what every student will.
 */
import { buildContentIndex } from '../src/game/engine/content-index'
import { applyAction, newGame, runDays } from '../src/game/engine/orchestrator'
import { nexoraContent } from '../src/content/nexora'
import { patternSuggestions } from '../src/store/selectors'
import { materialTopics } from '../src/game/debrief/review'
import { consequenceBand } from '../src/game/risk/bands'
import { formatGameDate } from '../src/game/time'
import type { Difficulty, GameState } from '../src/game/types'

const index = buildContentIndex(nexoraContent)
// The start screen always sends a situation, the first one unless another is
// chosen, so a seed link without one opens in it: play the same, or the table
// describes a year no student will be given.
const [, , countArg = '30', mode = 'ciso', prefix = 'class', situation = index.content.situations?.[0]?.id ?? ''] = process.argv

function engagedYear(state: GameState): void {
  const enquiries = ['inv-service-review', 'inv-access-review']
  let next = 0
  while (!state.finished) {
    for (const id of [...state.decisions.openIds]) {
      const def = index.decision.get(state.decisions.decisions[id]!.defId)!
      const tags = def.rationaleTagIds?.slice(0, 1) ?? ['rat-more-evidence']
      for (const option of def.options) {
        if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: tags }).ok) break
      }
    }
    const offered = patternSuggestions(state, index)[0]
    if (offered) {
      const made = applyAction(state, index, { type: 'createHypothesis', templateId: offered.templateId, evidenceIds: offered.evidence.map((e) => e.id) })
      if (made.ok) applyAction(state, index, { type: 'convertHypothesis', hypothesisId: Object.keys(state.risks.hypotheses).at(-1)! })
    }
    if (state.reviews.pendingQuarter !== undefined) {
      applyAction(state, index, {
        type: 'completeQuarterReview',
        quarter: state.reviews.pendingQuarter,
        topics: materialTopics(state, index).filter((t) => t.material).map((t) => t.id),
        recommendations: [],
        communicateUncertainty: true,
      })
    }
    for (const message of state.inbox.messages) if (!message.read) applyAction(state, index, { type: 'markRead', messageId: message.id })
    if (state.currentDay === 25) {
      const identity = index.programme.get('prog-identity')!
      applyAction(state, index, { type: 'startProgramme', programmeId: identity.id, budget: identity.budgetCost })
    }
    for (const programme of Object.values(state.programmes.programmes)) {
      for (const blocker of programme.blockers) {
        if (!blocker.resolved) applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: blocker.id })
      }
    }
    if (next < enquiries.length && state.team.assignments.every((a) => a.status !== 'running')) {
      const leader = index.content.leaders[next % index.content.leaders.length]!.id
      if (applyAction(state, index, { type: 'startInvestigation', investigationId: enquiries[next]!, leaderId: leader }).ok) next += 1
    }
    if (state.currentDay >= 363) applyAction(state, index, { type: 'finishCampaign' })
    else runDays(state, index, 1)
  }
}

const rows: string[] = []
for (let n = 1; n <= Number(countArg); n += 1) {
  const seed = `${prefix}-${n}`
  const state = newGame(index, { seed, difficulty: mode as Difficulty, situation })
  engagedYear(state)
  const idle = newGame(index, { seed, difficulty: mode as Difficulty, situation })
  runDays(idle, index, 364)
  const idleIncidents = Object.values(idle.incidents.incidents)
    .sort((a, b) => a.startedDay - b.startedDay)
    .map((incident) => `${index.incidentFamily.get(incident.familyId)?.name ?? incident.familyId} ${formatGameDate(incident.startedDay).label}`)
  const incidents = Object.values(state.incidents.incidents)
    .sort((a, b) => a.startedDay - b.startedDay)
    .map((incident) => `${index.incidentFamily.get(incident.familyId)?.name ?? incident.familyId} ${formatGameDate(incident.startedDay).label} (${consequenceBand(incident.consequence)})`)
  const objectives = Object.values(state.business.objectives)
  const met = objectives.filter((objective) => objective.status === 'achieved').length
  rows.push(
    [
      seed.padEnd(12),
      `${met}/${objectives.length} objectives`.padEnd(16),
      (state.reviews.annual?.performanceBand ?? '').padEnd(24),
      incidents.length === 0 ? 'no incident' : incidents.join('; '),
      `  | idle: ${idleIncidents.length === 0 ? 'no incident' : idleIncidents.join('; ')}`,
    ].join(' '),
  )
}
console.log(`${countArg} ${mode} years in ${situation}, played light and engaged (and, after the bar, by a player who does nothing):\n`)
console.log(rows.join('\n'))
