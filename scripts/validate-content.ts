/**
 * `pnpm validate:content`
 *
 * Schema-validates and integrity-checks the campaign bundle. Runs in CI and
 * before any release; a content error fails the build rather than shipping a
 * simulation that references ids that do not exist.
 */
import { campaignContentSchema } from '../src/lib/schemas/content'
import { validateCampaignContent } from '../src/lib/content/validate'
import { nexoraContentRaw } from '../src/content/nexora'
import type { CampaignContent } from '../src/game/types'

function main(): void {
  const parsed = campaignContentSchema.safeParse(nexoraContentRaw)
  if (!parsed.success) {
    console.error('Schema validation failed:\n')
    for (const issue of parsed.error.issues.slice(0, 40)) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    }
    console.error(`\n${parsed.error.issues.length} schema issue(s).`)
    process.exit(1)
  }

  const content = parsed.data as unknown as CampaignContent
  const issues = validateCampaignContent(content)
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  for (const issue of warnings) {
    console.warn(`  warning  ${issue.rule.padEnd(24)} ${issue.where}: ${issue.detail}`)
  }
  for (const issue of errors) {
    console.error(`  error    ${issue.rule.padEnd(24)} ${issue.where}: ${issue.detail}`)
  }

  const counts = {
    nodes: content.nodes.length,
    edges: content.edges.length,
    services: content.services.length,
    objectives: content.objectives.length,
    stakeholders: content.stakeholders.length,
    leaders: content.leaders.length,
    controls: content.controls.length,
    programmes: content.programmes.length,
    actors: content.actors.length,
    attackPaths: content.attackPaths.length,
    incidentFamilies: content.incidentFamilies.length,
    evidence: content.evidence.length,
    hypotheses: content.hypothesisTemplates.length,
    scenarios: content.riskScenarios.length,
    investigations: content.investigations.length,
    decisions: content.decisions.length,
    decisionOptions: content.decisions.reduce((sum, d) => sum + d.options.length, 0),
    events: content.events.length,
    assumptions: content.assumptions.length,
    glossary: content.glossary.length,
  }
  console.log('\nCampaign:', content.meta.title, `(${content.meta.id} v${content.meta.version})`)
  console.log(
    Object.entries(counts)
      .map(([key, value]) => `  ${key.padEnd(18)} ${value}`)
      .join('\n'),
  )

  if (errors.length > 0) {
    console.error(`\n${errors.length} content error(s).`)
    process.exit(1)
  }
  console.log(`\nContent valid. ${warnings.length} warning(s).`)
}

main()
