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
import { functionName, mostPressedFunction } from '../team/capacity'

/**
 * `{{pressedFunction}}` is the function closest to breaking; `{{scenario}}`
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
    .replaceAll('{{scenario}}', scenario ?? 'the risk')
    .replaceAll('{{unseenRisk}}', unseenRisk(state, index) ?? 'a risk')
}

/**
 * The most material open risk the board has not heard about: raised by the
 * player and on no quarter's agenda. "You are holding a risk assessment the
 * board has never seen" did not say which, and the third observed
 * playthrough could not work out what it had left off.
 */
function unseenRisk(state: GameState, index: ContentIndex): string | undefined {
  const reported = new Set(state.reviews.quarters.filter((review) => review.completed).flatMap((review) => review.topicsChosen))
  const candidates = Object.values(state.risks.scenarios)
    .filter((s) => s.status !== 'emerging' && s.status !== 'closed' && !reported.has(`risk:${s.id}`))
    .sort((a, b) => (b.lastAssessed?.residual ?? 0) - (a.lastAssessed?.residual ?? 0))
  const top = candidates[0]
  return top ? index.riskScenario.get(top.id)?.title : undefined
}
