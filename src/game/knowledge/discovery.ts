/**
 * Player knowledge: what the CISO has actually discovered, as opposed to what
 * is true (plan §14). The hidden graph is simulation truth; the discovered
 * subset is the player's understanding, and only the latter may reach the UI.
 */
import type { ContentIndex, EvidenceState, GameState, OrganisationState } from '../types'
import { clamp01 } from '../types'

export function revealNode(state: GameState, nodeId: string, confidence = 0.8): boolean {
  const node = state.organisation.nodes[nodeId]
  if (!node || !node.exists) return false
  const first = !node.discovered
  node.discovered = true
  node.discoveryConfidence = clamp01(Math.max(node.discoveryConfidence, confidence))
  return first
}

export function revealEdge(state: GameState, index: ContentIndex, edgeId: string, confidence = 0.8): boolean {
  const edge = state.organisation.edges[edgeId]
  if (!edge || !edge.exists) return false
  const first = !edge.discovered
  edge.discovered = true
  edge.discoveryConfidence = clamp01(Math.max(edge.discoveryConfidence, confidence))
  const def = index.edge.get(edgeId)
  if (def) {
    // Seeing a relationship implies seeing both ends of it.
    revealNode(state, def.from, Math.min(confidence, 0.7))
    revealNode(state, def.to, Math.min(confidence, 0.7))
  }
  return first
}

export function isEvidenceKnown(evidence: EvidenceState, evidenceId: string): boolean {
  return Boolean(evidence.items[evidenceId])
}

export function revealEvidence(
  state: GameState,
  index: ContentIndex,
  evidenceId: string,
  sourceLabel: string,
): boolean {
  const def = index.evidence.get(evidenceId)
  if (!def) return false
  if (state.evidence.items[evidenceId]) return false
  state.evidence.items[evidenceId] = {
    id: evidenceId,
    discoveredDay: state.currentDay,
    sourceLabel,
    read: false,
    archived: false,
    linkedHypothesisIds: [],
    expiresOnDay: def.expiresAfterDays ? state.currentDay + def.expiresAfterDays : undefined,
  }
  state.evidence.order.unshift(evidenceId)
  // Evidence about an entity implies the entity is at least partly known.
  for (const nodeId of def.affectedNodeIds) revealNode(state, nodeId, 0.55)
  return true
}

/**
 * Aggregate understanding per domain, recomputed after discovery changes.
 * Used for the Home screen's blind-spot language and the annual review.
 */
export function recomputeUnderstanding(state: GameState, index: ContentIndex): void {
  const domains: Record<string, { known: number; total: number }> = {}
  const bump = (domain: string, known: number) => {
    const bucket = (domains[domain] ??= { known: 0, total: 0 })
    bucket.total += 1
    bucket.known += known
  }
  for (const def of index.content.nodes) {
    const node = state.organisation.nodes[def.id]
    if (!node || !node.exists) continue
    const known = node.discovered ? node.discoveryConfidence : 0
    bump(domainForNodeType(def.type), known)
    bump('overall', known)
  }
  for (const def of index.content.edges) {
    const edge = state.organisation.edges[def.id]
    if (!edge || !edge.exists) continue
    bump('dependencies', edge.discovered ? edge.discoveryConfidence : 0)
  }
  const out: OrganisationState['understanding'] = {}
  for (const [domain, bucket] of Object.entries(domains)) {
    out[domain] = bucket.total > 0 ? clamp01(bucket.known / bucket.total) : 0
  }
  state.organisation.understanding = out
}

function domainForNodeType(type: string): string {
  switch (type) {
    case 'service':
      return 'services'
    case 'supplier':
      return 'suppliers'
    case 'identity':
      return 'identity'
    case 'cloud-platform':
    case 'infrastructure':
    case 'network-zone':
      return 'platform'
    case 'application':
      return 'applications'
    case 'data-set':
      return 'data'
    default:
      return 'other'
  }
}

/** Blind spots: material things that exist and matter but remain unseen. */
export function blindSpots(state: GameState, index: ContentIndex): string[] {
  const out: string[] = []
  for (const def of index.content.nodes) {
    const node = state.organisation.nodes[def.id]
    if (!node || !node.exists || node.discovered) continue
    if (def.criticality === 'critical' || def.criticality === 'high') {
      out.push(`${def.name} was never brought into view`)
    }
  }
  for (const def of index.content.edges) {
    const edge = state.organisation.edges[def.id]
    if (!edge || !edge.exists || edge.discovered) continue
    const from = index.node.get(def.from)
    const to = index.node.get(def.to)
    if (!from || !to) continue
    if (from.criticality === 'critical' || to.criticality === 'critical') {
      out.push(`the dependency between ${from.name} and ${to.name} stayed hidden`)
    }
  }
  return out.slice(0, 8)
}
