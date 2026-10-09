/**
 * `pnpm validate:content [--pack path/to/pack.json]`
 *
 * Schema-validates and integrity-checks a campaign pack — Nexora by default —
 * then holds its prose to the mechanical rules of docs/VOICE.md and reports
 * its size against the content budget (plan §4.3). Runs in CI and before any
 * release; a content error fails the build rather than shipping a simulation
 * that references ids that do not exist.
 */
import { campaignContentSchema } from '../src/lib/schemas/content'
import { validateCampaignContent } from '../src/lib/content/validate'
import type { CampaignContent } from '../src/game/types'
import { loadPack, packArgument } from './content/pack.ts'
import { collectLines, voiceIssues } from './content/voice.ts'
import { budgetReport } from './content/budget.ts'

function main(): void {
  const pack = loadPack(packArgument(process.argv.slice(2)).path)
  console.log(`Pack: ${pack.name}\n`)
  const parsed = campaignContentSchema.safeParse(pack.raw)
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

  const { lines, ids } = collectLines(pack.raw)
  const voice = voiceIssues(lines, ids)
  console.log(`\nVoice (docs/VOICE.md): ${lines.length} strings`)
  for (const issue of voice) console.error(`  error    voice:${issue.rule.padEnd(18)} ${issue.where}: ${issue.text}`)

  const budget = budgetReport(content)
  const short = budget.filter((line) => line.short)
  console.log('\nAgainst the content budget (plan §4.3):')
  for (const line of budget) {
    console.log(`  ${line.short ? 'short' : 'ok   '}  ${line.what.padEnd(30)} ${String(line.has).padStart(4)} of ${line.wants}`)
  }

  const failures = errors.length + voice.length
  if (failures > 0) {
    console.error(`\n${errors.length} content error(s), ${voice.length} voice error(s).`)
    process.exit(1)
  }
  console.log(`\nContent valid. ${warnings.length} warning(s); ${short.length} line(s) under the content budget.`)
}

main()
