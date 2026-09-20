/**
 * The Nexora campaign bundle.
 *
 * Content ships as static JSON imported at build time, so the whole campaign is
 * part of the client bundle and no network request is needed to play (plan §3.1).
 */
import meta from './meta.json'
import organisation from './organisation.json'
import people from './people.json'
import controls from './controls.json'
import programmes from './programmes.json'
import threats from './threats.json'
import evidence from './evidence.json'
import risks from './risks.json'
import investigations from './investigations.json'
import decisions from './decisions.json'
import spineEvents from './events/spine.json'
import businessEvents from './events/business.json'
import threatEvents from './events/threat.json'
import organisationEvents from './events/organisation.json'
import consequenceEvents from './events/consequences.json'
import fourthQuarterEvents from './events/fourth-quarter.json'
import type { CampaignContent } from '@/game/types'

/** Assembled, unvalidated campaign content. Validation happens in the loader. */
export const nexoraContentRaw: unknown = {
  meta,
  nodes: organisation.nodes,
  edges: organisation.edges,
  services: organisation.services,
  objectives: people.objectives,
  stakeholders: people.stakeholders,
  leaders: people.leaders,
  controls: controls.controls,
  programmes: programmes.programmes,
  actors: threats.actors,
  attackPaths: threats.attackPaths,
  incidentFamilies: threats.incidentFamilies,
  evidence: evidence.evidence,
  hypothesisTemplates: risks.hypothesisTemplates,
  riskScenarios: risks.riskScenarios,
  investigations: investigations.investigations,
  decisions: decisions.decisions,
  events: [
    ...spineEvents.events,
    ...businessEvents.events,
    ...threatEvents.events,
    ...organisationEvents.events,
    ...consequenceEvents.events,
    ...fourthQuarterEvents.events,
  ],
  rationaleTags: risks.rationaleTags,
  assumptions: risks.assumptions,
  glossary: investigations.glossary,
}

/** Typed view for callers that have already validated (or trust) the bundle. */
export const nexoraContent = nexoraContentRaw as CampaignContent
