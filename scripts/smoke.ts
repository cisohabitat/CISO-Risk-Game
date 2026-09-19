import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, runDays } from '../src/game/engine/orchestrator'
import { checkInvariants } from '../src/game/engine/invariants'
import { nexoraContent } from '../src/content/nexora'
import { buildAnnualReview } from '../src/game/debrief/review'

const index = buildContentIndex(nexoraContent)
const state = newGame(index, { seed: 'smoke-1' })
const start = Date.now()
const ticks = runDays(state, index, 364)
console.log('days simulated:', ticks.length, 'in', Date.now() - start, 'ms')
console.log('inbox messages:', state.inbox.messages.length)
console.log('events fired:', state.events.firedEventIds.length)
console.log('open decisions:', state.decisions.openIds.length, 'resolved:', state.decisions.resolvedIds.length)
console.log('incidents:', Object.keys(state.incidents.incidents).length)
console.log('campaigns:', state.threats.campaigns.length, 'breached:', state.threats.campaigns.filter(c=>c.incidentId).length)
console.log('scenarios:', Object.keys(state.risks.scenarios).length)
console.log('budget:', state.resources.budgetRemaining, '/', state.resources.budgetTotal)
console.log('violations:', checkInvariants(state, index).slice(0, 10))
const review = buildAnnualReview(state, index)
console.log('headline:', review.headline, '|', review.performanceBand)
console.log(review.narrative.join('\n'))
