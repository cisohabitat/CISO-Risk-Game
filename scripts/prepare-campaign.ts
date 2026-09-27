/**
 * Prints a saved campaign, played by the engine up to a stopping point, as
 * the JSON record the game keeps in IndexedDB.
 *
 *   pnpm tsx scripts/prepare-campaign.ts <seed> <pattern|board|incident|year-end|day:N> [difficulty]
 *
 * For screens that only exist months into a year. The guide's board-paper
 * picture used to be reached by driving a quarter of play through the
 * interface at 4x, which ran out of polls before the clock reached day 91 on
 * more runs than not; the browser test now loads this instead. It lives here
 * rather than in the browser test because Playwright loads modules as native
 * ESM, and the campaign's JSON imports are written for Vite and tsx.
 */
import { buildContentIndex } from '../src/game/engine/content-index'
import { applyAction, newGame, runDays } from '../src/game/engine/orchestrator'
import { nexoraContent } from '../src/content/nexora'
import { patternSuggestions } from '../src/store/selectors'
import { materialTopics } from '../src/game/debrief/review'
import { SAVE_SCHEMA_VERSION } from '../src/game/types'
import type { Difficulty, GameState } from '../src/game/types'

const index = buildContentIndex(nexoraContent)
const [, , seed = 'prepared', stop = 'board', difficulty = 'ciso'] = process.argv

const until = (state: GameState): boolean => {
  if (stop === 'pattern') return state.currentDay > 30 && patternSuggestions(state, index).length > 0
  if (stop === 'board') return state.reviews.pendingQuarter !== undefined
  if (stop === 'incident') return Object.values(state.incidents.incidents).some((i) => i.phase === 'containment')
  if (stop === 'year-end') return state.finished
  if (stop.startsWith('day:')) return state.currentDay >= Number(stop.slice(4))
  throw new Error(`unknown stopping point: ${stop}`)
}

const state = newGame(index, { seed, difficulty: difficulty as Difficulty })
// A light, engaged year: answer what is asked, form what the game notices,
// commission a couple of enquiries, run one programme, leave the rest.
const enquiries = ['inv-service-review', 'inv-access-review']
let next = 0
for (let day = 0; day < 366 && !state.finished && !until(state); day += 1) {
  for (const id of [...state.decisions.openIds]) {
    const def = index.decision.get(state.decisions.decisions[id]!.defId)!
    const tags = def.rationaleTagIds?.slice(0, 1) ?? ['rat-more-evidence']
    for (const option of def.options) {
      if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: tags }).ok) break
    }
  }
  // Take what the game notices, unless the point is to photograph the offer.
  const offered = stop === 'pattern' ? undefined : patternSuggestions(state, index)[0]
  if (offered) {
    const made = applyAction(state, index, {
      type: 'createHypothesis', templateId: offered.templateId, evidenceIds: offered.evidence.map((e) => e.id),
    })
    if (made.ok) applyAction(state, index, { type: 'convertHypothesis', hypothesisId: Object.keys(state.risks.hypotheses).at(-1)! })
  }
  // File each quarter's paper with what is material, unless the point is to
  // photograph one waiting; read the inbox; run the identity programme. A
  // year prepared without these showed a board paper "Due" on 30 December,
  // 157 unread messages and a review about a player who built nothing.
  if (stop !== 'board' && state.reviews.pendingQuarter !== undefined) {
    applyAction(state, index, {
      type: 'completeQuarterReview',
      quarter: state.reviews.pendingQuarter,
      topics: materialTopics(state, index).filter((t) => t.material).map((t) => t.id),
      recommendations: [],
      communicateUncertainty: true,
    })
  }
  for (const message of state.inbox.messages) if (!message.read) applyAction(state, index, { type: 'markRead', messageId: message.id })
  if (day === 25) {
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
  runDays(state, index, 1)
}
if (!until(state)) throw new Error(`never reached "${stop}" in a year`)

process.stdout.write(
  JSON.stringify({
    slot: `campaign:${state.gameId}`,
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAtIso: new Date().toISOString(),
    savedByPlayer: false,
    campaignTitle: index.content.meta.title,
    state,
  }),
)
