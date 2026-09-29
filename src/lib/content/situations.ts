/**
 * The starting situations as the start screen offers them. The start screen is
 * the one screen that does not need the campaign, so it reads the situations'
 * names from their own file rather than waiting for all of the content to
 * load; the build keeps this file out of the campaign chunk.
 */
import raw from '@/content/nexora/situations.json'

export interface SituationChoice {
  id: string
  name: string
  summary: string
}

export const situationChoices: SituationChoice[] = raw.situations.map(({ id, name, summary }) => ({ id, name, summary }))

export function situationName(id: string): string | undefined {
  return situationChoices.find((situation) => situation.id === id)?.name
}
