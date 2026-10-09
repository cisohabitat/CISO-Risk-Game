/**
 * A pack's size against the content budget in plan §4.3, the amount Nexora
 * shows is enough for a year. Below it is a warning, not an error: a pack can
 * be deliberately small, but its author should know.
 */
import type { CampaignContent } from '../../src/game/types'

export interface BudgetLine {
  what: string
  has: number
  wants: number
  short: boolean
}

export function budgetReport(content: CampaignContent): BudgetLine[] {
  const lines: [string, number, number][] = [
    ['Business services', content.services.length, 5],
    ['Important systems', content.nodes.length, 15],
    ['Dependency relationships', content.edges.length, 30],
    ['Executives and stakeholders', content.stakeholders.length, 6],
    ['Cyber leadership roles', content.leaders.length, 4],
    ['Strategic programmes', content.programmes.length, 6],
    ['Risk scenarios and hypotheses', content.riskScenarios.length + content.hypothesisTemplates.length, 25],
    ['Threat actors', content.actors.length, 3],
    ['Event pool', content.events.length, 80],
    ['Incident families', content.incidentFamilies.length, 4],
    ['Decisions', content.decisions.length, 30],
  ]
  return lines.map(([what, has, wants]) => ({ what, has, wants, short: has < wants }))
}
