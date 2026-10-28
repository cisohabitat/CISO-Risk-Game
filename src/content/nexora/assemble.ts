/**
 * Puts the Nexora campaign together from its files.
 *
 * Year Two's events and decisions are a separate module (`year-two.ts`) so the
 * app can leave them out of the campaign download until a second year starts:
 * a first year never reads them, and a first year played with or without them
 * ends in byte-identical state. When they are given, they go back exactly
 * where they used to sit in the content order, because a save reproduces its
 * own future only while the order it was played under stays the same.
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
import situationEvents from './events/situations.json'
import threatVarietyEvents from './events/threat-variety.json'
import aiAcceleratedEvents from './events/ai-accelerated.json'
import situations from './situations.json'

export interface YearTwoContent {
  events: unknown[]
  decisions: unknown[]
}

/** The decision Year Two's decisions were authored ahead of. */
export const YEAR_TWO_DECISIONS_BEFORE = 'dec-inc-rebuild'

/** Assembled, unvalidated campaign content. Validation happens in the loader. */
export function assembleNexora(yearTwo?: YearTwoContent): unknown {
  const firstYearDecisions: { id: string }[] = decisions.decisions
  const at = firstYearDecisions.findIndex((decision) => decision.id === YEAR_TWO_DECISIONS_BEFORE)
  if (at < 0) throw new Error(`${YEAR_TWO_DECISIONS_BEFORE} is missing: Year Two's decisions have nowhere to go.`)
  return {
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
    decisions: yearTwo
      ? [...firstYearDecisions.slice(0, at), ...yearTwo.decisions, ...firstYearDecisions.slice(at)]
      : firstYearDecisions,
    events: [
      ...spineEvents.events,
      ...businessEvents.events,
      ...threatEvents.events,
      ...organisationEvents.events,
      ...consequenceEvents.events,
      ...fourthQuarterEvents.events,
      ...situationEvents.events,
      ...(yearTwo?.events ?? []),
      ...threatVarietyEvents.events,
      ...aiAcceleratedEvents.events,
    ],
    rationaleTags: risks.rationaleTags,
    assumptions: risks.assumptions,
    glossary: investigations.glossary,
    situations: situations.situations,
  }
}
