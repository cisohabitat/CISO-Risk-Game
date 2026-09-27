/**
 * Player knowledge: what the CISO has actually discovered, as opposed to what
 * is true (plan §14). The hidden graph is simulation truth; the discovered
 * subset is the player's understanding, and only the latter may reach the UI.
 */
import type { ContentIndex, EvidenceState, GameState, OrganisationState } from '../types'
import { clamp01 } from '../types'

export function revealNode(state: GameState, nodeId: string, confidence = 0.8, verified = false): boolean {
  const node = state.organisation.nodes[nodeId]
  if (!node || !node.exists) return false
  const first = !node.discovered
  node.discovered = true
  node.discoveryConfidence = clamp01(Math.max(node.discoveryConfidence, confidence))
  // Verification only ever goes one way: hearing about something again does
  // not undo having examined it, and examining it cannot be undone by hearsay.
  if (verified) node.verified = true
  return first
}

export function revealEdge(
  state: GameState,
  index: ContentIndex,
  edgeId: string,
  confidence = 0.8,
  verified = false,
): boolean {
  const edge = state.organisation.edges[edgeId]
  if (!edge || !edge.exists) return false
  const first = !edge.discovered
  edge.discovered = true
  edge.discoveryConfidence = clamp01(Math.max(edge.discoveryConfidence, confidence))
  if (verified) edge.verified = true
  const def = index.edge.get(edgeId)
  if (def) {
    // Seeing a relationship implies seeing both ends of it — but only that they
    // are there. Tracing a dependency is not the same as having examined what
    // sits at either end of it, so the ends are not marked verified here.
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
  // Uncapped: the review caps the list it shows and counts the rest, and a
  // count taken from a capped list undercounts.
  return out
}

/**
 * What the player could have examined for themselves, and did not.
 *
 * Counting undiscovered entities does not work: most of the estate arrives in
 * the inherited register or gets mentioned in passing by an event, so by the
 * end of an idle year almost everything is "discovered" and the measure reads
 * strong for a player who never looked at anything. The inherited picture is
 * belief, not knowledge — that is the whole premise — so this counts what was
 * established by the player's own work instead.
 *
 * The denominator is only what was actually reachable: material nodes and
 * dependencies some investigation could have examined, plus the controls,
 * which can all be assessed. Scoring against the whole estate would make the
 * dimension unwinnable, which is the same defect pointing the other way.
 */
export function unexaminedMaterial(
  state: GameState,
  index: ContentIndex,
): { examined: number; reachable: number; names: string[] } {
  const reachableNodes = new Set<string>()
  const reachableEdges = new Set<string>()
  for (const def of index.content.investigations) {
    for (const id of def.revealsNodeIds) reachableNodes.add(id)
    for (const id of def.revealsEdgeIds) reachableEdges.add(id)
  }

  let examined = 0
  let reachable = 0
  const names: string[] = []

  for (const def of index.content.nodes) {
    if (!reachableNodes.has(def.id)) continue
    if (def.criticality !== 'critical' && def.criticality !== 'high') continue
    const node = state.organisation.nodes[def.id]
    if (!node?.exists) continue
    reachable += 1
    if (node.verified) examined += 1
    // "Taken on trust" only makes sense about something you knew was there.
    // Something never discovered is named by blindSpots as never seen, and the
    // review listed both, so one system appeared twice in the same list under
    // two descriptions that contradict each other.
    else if (node.discovered) names.push(`${def.name} was taken on trust and never examined`)
  }

  for (const def of index.content.edges) {
    if (!reachableEdges.has(def.id)) continue
    const from = index.node.get(def.from)
    const to = index.node.get(def.to)
    if (from?.criticality !== 'critical' && to?.criticality !== 'critical') continue
    const edge = state.organisation.edges[def.id]
    if (!edge?.exists) continue
    reachable += 1
    if (edge.verified) examined += 1
    // The same line as for nodes: a dependency nobody ever discovered is named
    // by blindSpots as hidden, and naming it here as well put one dependency in
    // the review twice, once as "stayed hidden" and once as "was never traced".
    // Every transcript read in grading had two such pairs.
    else if (edge.discovered && from && to) names.push(`the dependency between ${from.name} and ${to.name} was never traced`)
  }

  for (const def of index.content.controls) {
    const control = state.controls.controls[def.id]
    if (!control) continue
    reachable += 1
    // Assurance ages. A test from ten months ago describes a control that has
    // drifted since, so it no longer counts as knowing.
    //
    // And it has to be the player's own. The inherited picture is recorded at
    // day -180, so for the first twenty days it still counted as knowing and
    // the Briefing told a brand-new CISO they had checked "a start" of Nexora
    // — 13 of 32 — before they had looked at anything, then took it away on
    // day 21 without explaining why. Nodes and edges already draw this line
    // with `verified`; a negative day is by definition before the player
    // arrived.
    if (
      control.believed &&
      control.believed.assessedOnDay >= 0 &&
      state.currentDay - control.believed.assessedOnDay < ASSURANCE_LIFE_DAYS
    ) {
      examined += 1
    }
    else names.push(`${def.name} was never independently assessed`)
  }

  return { examined, reachable, names }
}

/** How long an assessment describes the control it was taken from. */
export const ASSURANCE_LIFE_DAYS = 200

/** The share of what could have been examined that never was. */
export function materialBlindSpotRatio(state: GameState, index: ContentIndex): number {
  const { examined, reachable } = unexaminedMaterial(state, index)
  return reachable > 0 ? clamp01(1 - examined / reachable) : 0
}
