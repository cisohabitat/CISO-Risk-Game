/**
 * Decision text with the one thing content cannot know at authoring time.
 *
 * The overload decision fires on whichever function is closest to breaking,
 * and its authored text said "the SOC lead" whatever that function was. A
 * player told the SOC was overloaded, with the SOC idle and identity breaking,
 * had no way to act on "stop something". `{{pressedFunction}}` is resolved
 * here, in one place, for the interface and the harness alike.
 */
import type { ContentIndex, GameState } from '../types'
import { functionName, mostPressedFunction } from '../team/capacity'

export function renderDecisionText(text: string, state: GameState, index: ContentIndex): string {
  void index
  if (!text.includes('{{')) return text
  return text.replaceAll('{{pressedFunction}}', functionName(mostPressedFunction(state)))
}
