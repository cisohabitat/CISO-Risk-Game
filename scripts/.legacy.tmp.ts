import { buildContentIndex } from '../src/game/engine/content-index'
import { applyAction, newGame, runDays } from '../src/game/engine/orchestrator'
import { nexoraContent } from '../src/content/nexora'
import { buildAnnualReview } from '../src/game/debrief/review'
const index = buildContentIndex(nexoraContent)
let told = 0, toldHidden = 0, spotLines = 0
for (let i = 0; i < 40; i++) {
  const state = newGame(index, { seed: `legacy-${i}`, difficulty: 'ciso' })
  for (let day = 0; day < 364; day++) {
    for (const id of [...state.decisions.openIds]) {
      const def = index.decision.get(state.decisions.decisions[id]!.defId)!
      const opts = [def.options.find((o) => o.id === def.defaultOptionId)!, ...def.options]
      for (const o of opts) if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: o.id, rationaleTagIds: def.rationaleTagIds?.slice(0, 1) ?? ['rat-more-evidence'] }).ok) break
    }
    runDays(state, index, 1)
  }
  const got = state.inbox.messages.some((m) => m.eventId === 'evt-pentest-scoping')
  if (got) told++
  if (got && !state.organisation.nodes['node-dc-legacy']!.discovered) toldHidden++
  const review = buildAnnualReview(state, index)
  if (review.blindSpots.some((s) => s.includes('Legacy Data Centre was never'))) spotLines++
}
console.log({ told, toldHidden, spotLines })
