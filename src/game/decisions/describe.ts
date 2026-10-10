/**
 * Decision text with the one thing content cannot know at authoring time.
 *
 * The overload decision fires on whichever function is closest to breaking,
 * and its authored text said "the SOC lead" whatever that function was. A
 * player told the SOC was overloaded, with the SOC idle and identity breaking,
 * had no way to act on "stop something". `{{pressedFunction}}` is resolved
 * here, in one place, for the interface and the harness alike.
 */
import type { ContentIndex, DecisionRuntime, GameState } from '../types'
import { CAMPAIGN_DAYS, DAYS_PER_QUARTER } from '../types'
import { functionName, functionTitle, leaderForFunction, mostPressedFunction } from '../team/capacity'
import { unreportedScenarios } from '../risk/unreported'

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
  runtime?: Pick<DecisionRuntime, 'scenarioId'>,
): string {
  if (!text.includes('{{')) return text
  const scenario = runtime?.scenarioId ? index.riskScenario.get(runtime.scenarioId)?.title : undefined
  return text
    .replaceAll('{{pressedFunction}}', functionName(mostPressedFunction(state)))
    .replaceAll('{{PressedFunction}}', functionTitle(mostPressedFunction(state)))
    .replaceAll('{{pressedLeader}}', pressedLeader(state, index))
    .replaceAll('{{scenario}}', scenario ?? 'the risk')
    .replaceAll('{{unseenRisk}}', unseenRisk(state, index) ?? 'a risk')
    // A quarter's paper still waiting to go in is the next meeting, whatever
    // the calendar says comes after it.
    .replaceAll('{{nextBoard}}', state.reviews.pendingQuarter !== undefined ? 'this week' : nextBoard(state.currentDay))
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
