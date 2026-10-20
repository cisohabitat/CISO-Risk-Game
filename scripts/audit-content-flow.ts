/** Offline content audit. Engine policies are probes, not human playtests. */
import assert from 'node:assert/strict'
import { buildContentIndex } from '../src/game/engine/content-index'
import { nexoraContent } from '../src/content/nexora'
import { newGame, applyAction, runDays } from '../src/game/engine/orchestrator'
import { beginNextYear } from '../src/game/engine/next-year'
import { checkInvariants } from '../src/game/engine/invariants'
import { finishYear } from '../src/game/debrief/review'
import { completeQuarterIfDue, rationaleFor } from './play-helpers'
import { CAMPAIGN_DAYS, type GameState } from '../src/game/types'

const index = buildContentIndex(nexoraContent)
const count = Number(process.argv[2] ?? 6)
assert(Number.isInteger(count) && count >= 1 && count <= 100, 'Supply 1–100 seeds')

type Policy = 'identity-first-options' | 'cloud-reverse-options'
const policies: Policy[] = ['identity-first-options', 'cloud-reverse-options']

function play(seed: string, policy: Policy) {
  let state = newGame(index, { seed, difficulty: 'ciso', situation: 'sit-inherited-mess' })
  const openingWorld = JSON.stringify([state.organisation, state.controls, state.business, state.threats])
  const years = []
  for (let year = 1; year <= 2; year += 1) {
    let started = false
    let enquiry = 0
    const enquiries = ['inv-service-review', 'inv-access-review']
    const programmeOrder = policy === 'identity-first-options'
      ? ['prog-identity', 'prog-ransomware', 'prog-cloud']
      : ['prog-cloud', 'prog-thirdparty', 'prog-identity']
    while (!state.finished && state.currentDay < CAMPAIGN_DAYS) {
      for (const id of [...state.decisions.openIds]) {
        const def = index.decision.get(state.decisions.decisions[id]!.defId)!
        const options = policy === 'identity-first-options' ? def.options : [...def.options].reverse()
        for (const option of options) {
          if (applyAction(state, index, {
            type: 'resolveDecision', decisionId: id, optionId: option.id,
            rationaleTagIds: rationaleFor(index, def.id, 'rat-more-evidence'),
          }).ok) break
        }
      }
      completeQuarterIfDue(state, index)
      if (!started) {
        const id = programmeOrder.find((id) => state.programmes.programmes[id]?.status === 'proposed')
        if (id) started = applyAction(state, index, {
          type: 'startProgramme', programmeId: id, budget: index.programme.get(id)!.budgetCost,
        }).ok
      }
      for (const programme of Object.values(state.programmes.programmes)) {
        for (const blocker of programme.blockers.filter((item) => !item.resolved)) {
          applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: blocker.id })
        }
      }
      if (enquiry < enquiries.length && state.currentDay % 7 === 0 && !state.team.assignments.some((work) => work.status === 'running')) {
        if (applyAction(state, index, {
          type: 'startInvestigation', investigationId: enquiries[enquiry]!, leaderId: 'lead-grc',
        }).ok) enquiry += 1
      }
      for (const message of state.inbox.messages) {
        if (!message.read) applyAction(state, index, { type: 'markRead', messageId: message.id })
      }
      runDays(state, index, 1)
      assert.deepEqual(checkInvariants(state, index), [], `${seed}, ${policy}, year ${year}, day ${state.currentDay}`)
    }
    finishYear(state, index)
    years.push(summarise(state))
    if (year === 1) state = beginNextYear(index, state)
  }
  return { openingWorld, years }
}

function summarise(state: GameState) {
  const groups = new Map<string, { eventId?: string; subject: string; count: number }>()
  for (const message of state.inbox.messages) {
    const key = JSON.stringify([message.from, message.subject, message.body])
    const group = groups.get(key)
    if (group) group.count += 1
    else groups.set(key, { eventId: message.eventId, subject: message.subject, count: 1 })
  }
  const days = [...new Set([0, ...Object.values(state.decisions.decisions).map((decision) => decision.createdDay), CAMPAIGN_DAYS])].sort((a, b) => a - b)
  const review = state.reviews.annual!
  return {
    year: state.year ?? 1,
    choices: state.history.decisionsLog.map((entry) => ({ day: entry.day, optionId: entry.optionId })),
    decisionArrivalGapDays: Math.max(...days.slice(1).map((day, i) => day - days[i]!)),
    messages: state.inbox.messages.length,
    repeatedCorrespondence: [...groups.values()].filter((group) => group.count > 1).sort((a, b) => b.count - a.count),
    callbacksReceived: state.inbox.messages.filter((message) => message.eventId && index.event.get(message.eventId)?.tags.includes('consequence')).map((message) => message.eventId),
    pendingReplies: state.events.scheduled.map((entry) => entry.eventId),
    programmes: Object.values(state.programmes.programmes).filter((programme) => programme.status !== 'proposed').map((programme) => ({ id: programme.id, status: programme.status })),
    headline: review.headline,
    performanceBand: review.performanceBand,
    dimensions: review.dimensions.map((dimension) => ({ id: dimension.id, band: dimension.band })),
  }
}

const schedules = new Map<string, string[]>()
function inspect(value: unknown, source: string) {
  if (Array.isArray(value)) value.forEach((item) => inspect(item, source))
  else if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>
    if (item.type === 'event.schedule' && typeof item.eventId === 'string') {
      schedules.set(item.eventId, [...(schedules.get(item.eventId) ?? []), source])
    }
    Object.values(item).forEach((nested) => inspect(nested, source))
  }
}
for (const decision of index.content.decisions) {
  for (const option of decision.options) inspect(option, `${decision.id}/${option.id}`)
}
for (const event of index.content.events) inspect(event, event.id)
const unreferencedReplies = index.content.events.filter((event) => event.scheduledOnly && !schedules.has(event.id)).map((event) => event.id)
const authoredBodies = new Map<string, string[]>()
for (const event of index.content.events) authoredBodies.set(event.body, [...(authoredBodies.get(event.body) ?? []), event.id])
assert.deepEqual(unreferencedReplies, [], 'Scheduled-only reply without an authored scheduler')
for (const eventId of schedules.keys()) assert(index.event.has(eventId), `Missing scheduled event ${eventId}`)

const pairs = Array.from({ length: count }, (_, i) => {
  const seed = `content-audit-${i + 1}`
  const runs = policies.map((policy) => {
    const run = play(seed, policy)
    assert.deepEqual(play(seed, policy), run, `${seed}/${policy}: replay changed without a changed policy`)
    return { policy, ...run }
  })
  assert.equal(runs[0]!.openingWorld, runs[1]!.openingWorld, `${seed}: starting world changed between policies`)
  const [first, second] = runs
  return {
    seed, sameStartingWorld: true, deterministic: true,
    differentChoiceRecords: JSON.stringify(first!.years.map((year) => year.choices)) !== JSON.stringify(second!.years.map((year) => year.choices)),
    differentCallbackSets: JSON.stringify(first!.years.map((year) => [...new Set(year.callbacksReceived)].sort())) !== JSON.stringify(second!.years.map((year) => [...new Set(year.callbacksReceived)].sort())),
    differentReviews: JSON.stringify(first!.years.map(({ headline, performanceBand, dimensions }) => ({ headline, performanceBand, dimensions }))) !== JSON.stringify(second!.years.map(({ headline, performanceBand, dimensions }) => ({ headline, performanceBand, dimensions }))),
    runs: runs.map(({ policy, years }) => ({ policy, years })),
  }
})

console.log(JSON.stringify({
  method: 'Fixed CISO mode and inherited-mess opening. First/reverse affordable options, identity/cloud programme order; up to two enquiries per year, material board papers, affordable blocker resolutions and daily mail clearance. No automatic programme resumption. Not human engagement evidence or a controlled single-choice experiment.',
  uniqueCampaignYears: count * policies.length * 2,
  replayedCampaignYears: count * policies.length * 2,
  events: index.content.events.length,
  decisionOptions: index.content.decisions.reduce((sum, decision) => sum + decision.options.length, 0),
  replySources: Object.fromEntries(schedules), unreferencedReplies,
  duplicateAuthoredBodyGroups: [...authoredBodies.values()].filter((ids) => ids.length > 1),
  repeatableEventIds: index.content.events.filter((event) => !event.oncePerCampaign).map((event) => event.id),
  pairs,
}, null, 2))
