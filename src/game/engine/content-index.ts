/**
 * Builds the in-memory index over authored content. Done once at load so the
 * per-day tick never scans arrays. The index is derived data and is never
 * written into a save.
 */
import type { CampaignContent, ContentIndex, OrgEdgeDef } from '../types'

function toMap<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>()
  for (const item of items) map.set(item.id, item)
  return map
}

export function buildContentIndex(content: CampaignContent): ContentIndex {
  const outgoing = new Map<string, OrgEdgeDef[]>()
  const incoming = new Map<string, OrgEdgeDef[]>()
  for (const edge of content.edges) {
    const from = outgoing.get(edge.from) ?? []
    from.push(edge)
    outgoing.set(edge.from, from)
    const to = incoming.get(edge.to) ?? []
    to.push(edge)
    incoming.set(edge.to, to)
  }

  const controlSteps = new Map<string, string[]>()
  for (const path of content.attackPaths) {
    for (const step of path.steps) {
      for (const controlId of step.controlIds) {
        const steps = controlSteps.get(controlId) ?? []
        steps.push(step.id)
        controlSteps.set(controlId, steps)
      }
    }
  }

  return {
    content,
    node: toMap(content.nodes),
    edge: toMap(content.edges),
    service: toMap(content.services),
    objective: toMap(content.objectives),
    stakeholder: toMap(content.stakeholders),
    leader: toMap(content.leaders),
    control: toMap(content.controls),
    programme: toMap(content.programmes),
    actor: toMap(content.actors),
    attackPath: toMap(content.attackPaths),
    incidentFamily: toMap(content.incidentFamilies),
    evidence: toMap(content.evidence),
    hypothesisTemplate: toMap(content.hypothesisTemplates),
    riskScenario: toMap(content.riskScenarios),
    investigation: toMap(content.investigations),
    decision: toMap(content.decisions),
    event: toMap(content.events),
    rationaleTag: toMap(content.rationaleTags),
    assumption: toMap(content.assumptions),
    glossary: toMap(content.glossary),
    situation: toMap(content.situations ?? []),
    outgoing,
    incoming,
    controlSteps,
  }
}
