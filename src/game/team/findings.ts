/**
 * What a returned enquiry reports, in words.
 *
 * Only evidence was reported, so an enquiry whose work was mapping systems,
 * tracing dependencies or testing a control came back "It confirmed what you
 * already had, and found nothing new" — the £90k Kestrel due diligence among
 * them (AI panel, 9 October 2026). Read before the enquiry's effects apply, so
 * "new" means new to the player.
 */
import type { ContentIndex, GameState } from '../types'

export interface EnquiryReach {
  evidenceIds: string[]
  nodeIds: string[]
  edgeIds: string[]
  controlIds: string[]
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

const lowerFirst = (name: string) => (/^[A-Z][a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name)

/** The sentences that follow an enquiry's summary, each with a leading space. */
export function enquiryFindings(state: GameState, index: ContentIndex, reach: EnquiryReach): string {
  const titles = (ids: string[]) =>
    ids.map((id) => index.evidence.get(id)?.title).filter((title): title is string => Boolean(title))
  // Last year's findings, dated before this year began, come back as this year's.
  const known = (id: string) => (state.evidence.items[id]?.discoveredDay ?? -1) >= 0
  const found = titles(reach.evidenceIds.filter((id) => !known(id)))
  const confirmed = titles(reach.evidenceIds.filter(known))
  const systems = reach.nodeIds
    .filter((id) => state.organisation.nodes[id]?.exists && !state.organisation.nodes[id]?.discovered)
    .map((id) => index.node.get(id)?.name)
    .filter((name): name is string => Boolean(name))
  const traced = reach.edgeIds.filter((id) => state.organisation.edges[id]?.exists && !state.organisation.edges[id]?.discovered).length
  const assessed = reach.controlIds.map((id) => index.control.get(id)?.name).filter((name): name is string => Boolean(name))

  const parts: string[] = []
  if (found.length > 0) parts.push(`What came back: ${found.join('; ')}.`)
  if (systems.length > 0) parts.push(`It found ${systems.length === 1 ? 'a system' : 'systems'} you had not mapped: ${list(systems)}.`)
  if (traced > 0) parts.push(`It traced ${traced === 1 ? 'a dependency' : `${traced} dependencies`} you had not mapped.`)
  if (assessed.length > 0) parts.push(`It assessed ${list(assessed.map(lowerFirst))}, so what you believe of ${assessed.length === 1 ? 'it' : 'them'} is now current.`)

  if (parts.length === 0) {
    return confirmed.length > 0 ? ` It confirmed what you already had (${confirmed.join('; ')}) and found nothing new.` : ''
  }
  if (confirmed.length > 0) {
    parts.push(`It also confirmed ${confirmed.length === 1 ? 'one thing' : `${confirmed.length} things`} you already had.`)
  }
  return ` ${parts.join(' ')}`
}
