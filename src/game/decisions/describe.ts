/**
 * Decision text with the one thing content cannot know at authoring time.
 *
 * The overload decision fires on whichever function is closest to breaking,
 * and its authored text said "the SOC lead" whatever that function was. A
 * player told the SOC was overloaded, with the SOC idle and identity breaking,
 * had no way to act on "stop something". `{{pressedFunction}}` is resolved
 * here, in one place, for the interface and the harness alike.
 */
import { scaledPostIncidentAmount } from '../budget/post-incident'
import type { ContentIndex, DecisionRuntime, GameState } from '../types'
import { CAMPAIGN_DAYS, DAYS_PER_QUARTER, money } from '../types'
import { functionName, functionTitle, leaderForFunction, mostPressedFunction } from '../team/capacity'
import { unreportedScenarios } from '../risk/unreported'
import { stopCandidate } from '../team/assignments'
import { carriedAcceptances } from '../risk/carried'

/**
 * `{{pressedFunction}}` is the function closest to breaking and
 * `{{pressedLeader}}` the person who runs it, for the message that raises it;
 * `{{scenario}}`
 * is the risk scenario the decision was opened about, for a decision that is
 * authored once and fires for any of them.
 */
export function renderDecisionText(
  text: string,
  state: GameState,
  index: ContentIndex,
  runtime?: Pick<DecisionRuntime, 'scenarioId' | 'incidentId'>,
): string {
  if (!text.includes('{{')) return text
  const scenario = runtime?.scenarioId ? index.riskScenario.get(runtime.scenarioId)?.title : undefined
  const incident = runtime?.incidentId ? state.incidents.incidents[runtime.incidentId] : undefined
  const incidentName = incident ? index.incidentFamily.get(incident.familyId)?.name : undefined
  return text
    .replace(/\{\{programmeReview:([^}]+)\}\}/g, (_, id: string) => state.history.entries.findLast((entry) => entry.kind === 'programme-review' && entry.day === state.currentDay && entry.refs?.includes(id))?.summary ?? 'No dated programme review was recorded.')
    .replaceAll('{{closedIncident}}', incidentName ?? 'the earlier incident')
    .replaceAll('{{postFunding}}', postFunding(state, incident))
    .replaceAll('{{refundUse}}', refundUse(state))
    .replaceAll('{{pressedFunction}}', functionName(mostPressedFunction(state)))
    .replaceAll('{{PressedFunction}}', functionTitle(mostPressedFunction(state)))
    .replaceAll('{{pressedLeader}}', pressedLeader(state, index))
    .replaceAll('{{stopTarget}}', stopTarget(state, index))
    .replaceAll('{{overloadHistory}}', overloadHistory(state, index))
    .replaceAll('{{scenario}}', scenario ?? 'the risk')
    .replaceAll('{{unseenRisk}}', unseenRisk(state, index) ?? 'a risk')
    .replaceAll('{{acceptedRisks}}', acceptedRisks(state, index))
    .replaceAll('{{blockedProgramme}}', longestBlocked(state, index)?.programme ?? 'one of your programmes')
    .replaceAll('{{BlockedProgramme}}', capitalise(longestBlocked(state, index)?.programme ?? 'one of your programmes'))
    .replaceAll('{{blocker}}', longestBlocked(state, index)?.blocker ?? 'a blocker')
    // A quarter's paper still waiting to go in is the next meeting, whatever
    // the calendar says comes after it.
    .replaceAll('{{nextBoard}}', state.reviews.pendingQuarter !== undefined ? 'this week' : nextBoard(state.currentDay))
}

const ORDINAL = ['', '', 'second', 'third', 'fourth', 'fifth']

/**
 * The overload decision remembers it has been asked before: it came three
 * times a year word for word (owner, 25 November: design issue P).
 */
function overloadHistory(state: GameState, index: ContentIndex): string {
  const earlier = Object.values(state.decisions.decisions)
    .filter((decision) => decision.defId === 'dec-team-overload' && decision.selectedOptionId !== undefined)
    .sort((a, b) => a.createdDay - b.createdDay)
  if (earlier.length === 0) return ''
  const last = earlier.at(-1)!
  const label = index.decision.get('dec-team-overload')?.options.find((option) => option.id === last.selectedOptionId)?.label
  const time = ORDINAL[earlier.length + 1] ?? 'latest'
  return ` This is the ${time} time this year they have said so.${label ? ` Last time the answer was "${label}".` : ''}`
}

/** What "Stop something" would stop today, named. */
function stopTarget(state: GameState, index: ContentIndex): string {
  const target = stopCandidate(state, index, mostPressedFunction(state))
  if (!target) return 'nothing: no enquiry or programme is running on that team'
  return target.kind === 'investigation' ? `the enquiry "${target.title}", abandoned` : `${target.title}, paused`
}

/** "Name, Role" of whoever runs the most pressed function. */
function pressedLeader(state: GameState, index: ContentIndex): string {
  const id = leaderForFunction(index, mostPressedFunction(state))
  const leader = index.content.leaders.find((candidate) => candidate.id === id)
  return leader ? `${leader.name}, ${leader.role}` : 'Your security leadership team'
}

const WEEKS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen']

/**
 * When the board next meets, in words. "The next scheduled meeting is in six
 * weeks" was authored once and fired on day 70, three weeks before the first
 * quarter's paper was due.
 */
export function nextBoard(day: number): string {
  const next = (Math.floor(day / DAYS_PER_QUARTER) + 1) * DAYS_PER_QUARTER
  if (next >= CAMPAIGN_DAYS) return 'not until the new year'
  const weeks = Math.round((next - day) / 7)
  if (weeks <= 0) return 'this week'
  if (weeks === 1) return 'next week'
  return `in ${WEEKS[weeks] ?? weeks} weeks`
}

/**
 * The most material open risk the board has not heard about: raised by the
 * player and on no quarter's agenda. "You are holding a risk assessment the
 * board has never seen" did not say which, and the third observed
 * playthrough could not work out what it had left off.
 */
function unseenRisk(state: GameState, index: ContentIndex): string | undefined {
  const top = unreportedScenarios(state)[0]
  return top ? index.riskScenario.get(top.id)?.title : undefined
}

/**
 * The programme blocked longest, and what is blocking it. "A programme has
 * stalled" said "One of your programmes" five times in one second year, word
 * for word, and never which.
 */
function longestBlocked(state: GameState, index: ContentIndex): { programme: string; blocker: string } | undefined {
  let found: { programme: string; blocker: string; since: number } | undefined
  for (const runtime of Object.values(state.programmes.programmes)) {
    if (runtime.status !== 'active' && runtime.status !== 'at-risk') continue
    const def = index.programme.get(runtime.id)
    for (const blocker of runtime.blockers) {
      if (blocker.resolved || (found && found.since <= blocker.startedDay)) continue
      const name = def?.blockers.find((candidate) => candidate.id === blocker.id)?.name
      if (!def || !name) continue
      // "the identity uplift programme": the full name reads as a title, not as a noun in a sentence.
      const short = def.shortName.charAt(0).toLowerCase() + def.shortName.slice(1)
      found = { programme: `the ${/programme$/.test(short) ? short : `${short} programme`}`, blocker: name, since: blocker.startedDay }
    }
  }
  return found
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** The risks standing accepted, by name: "Some of the risks you accepted" named none. */
function acceptedRisks(state: GameState, index: ContentIndex): string {
  const titles = carriedAcceptances(state)
    .map((scenario) => index.riskScenario.get(scenario.id)?.title)
    .filter((title): title is string => Boolean(title))
  return titles.length > 0 ? titles.join('; ') : 'none, as it turns out'
}

/** "£280k, of which £150k pays down unbudgeted spend": what the post-incident money is, before it is asked for. */
function postFunding(state: GameState, incident: GameState['incidents']['incidents'][string] | undefined): string {
  const amount = scaledPostIncidentAmount(state, 400, incident)
  const owed = Math.min(amount, state.resources.unfundedCommitment)
  return owed > 0 ? `${money(amount)}, of which ${money(owed)} pays down the unbudgeted spend` : money(amount)
}

/** Said in the letter when money that came back went first against what is owed: it paid down debt silently (427b290 playtest, MN-01). */
function refundUse(state: GameState): string {
  const repaid = state.history.entries.findLast((entry) => entry.kind === 'budget' && entry.day === state.currentDay && entry.summary.includes('paid against the unbudgeted spend'))
  return repaid ? ` Finance has set it against the unbudgeted spend first: ${repaid.summary.charAt(0).toLowerCase()}${repaid.summary.slice(1)}` : ''
}
