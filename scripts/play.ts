/**
 * Interactive playthrough driver: runs until something needs the player, prints
 * the situation, and stops. State persists between invocations so a year can be
 * played one decision at a time.
 *
 *   pnpm play new [difficulty] [seed]
 *   pnpm play decide <optionId> [rationaleTag]
 *   pnpm play go                        # advance to the next stop
 *   pnpm play commission <investigationId> <leaderId>
 *   pnpm play programme <programmeId>
 *   pnpm play pattern <form|dismiss>
 *   pnpm play board                     # take the material items
 *   pnpm play risk <open|accept> <scenarioId> [rationaleTag]
 *   pnpm play look <risk|team|programmes|org>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, applyAction, runDays } from '../src/game/engine/orchestrator'
import { nexoraContent } from '../src/content/nexora'
import { buildAnnualReview, materialTopics } from '../src/game/debrief/review'
import { patternSuggestions, incidentCommand, collisions, briefing, teamView, programmeViews, visibleRisks } from '../src/store/selectors'
import type { Difficulty, GameState } from '../src/game/types'

// Gitignored, and outside the session's temp dir so a year survives a restart.
const SAVE = process.env.PLAY_STATE ?? 'playthrough/manual-state.json'
const index = buildContentIndex(nexoraContent)
const [, , command, ...args] = process.argv

function load(): GameState {
  return JSON.parse(readFileSync(SAVE, 'utf8')) as GameState
}
function save(state: GameState): void {
  mkdirSync(dirname(SAVE), { recursive: true })
  writeFileSync(SAVE, JSON.stringify(state))
}

function report(state: GameState, since: number): void {
  const view = briefing(state, index)
  console.log(`\n=== ${view.dateLabel} · ${view.weekLabel} · Q${view.quarter} (day ${state.currentDay}) ===`)
  console.log(`budget £${(state.resources.budgetRemaining / 1000).toFixed(1)}m · attention ${state.resources.focusRemaining}/${view.focusPerWeek} · team ${view.teamCapacity} · board ${view.boardConfidence}`)

  const fresh = state.inbox.messages.filter((m) => m.day >= since)
  const notable = fresh.filter((m) => m.priority !== 'routine')
  if (notable.length > 0) {
    console.log(`\nWHAT ARRIVED (${fresh.length} messages, ${notable.length} not routine)`)
    for (const m of notable.slice(0, 8)) console.log(`  d${m.day} [${m.priority}] ${m.from}: ${m.subject}`)
  }

  const inc = incidentCommand(state, index)
  if (inc) {
    console.log(`\n!! INCIDENT: ${inc.name} — ${inc.phaseLabel}, ${inc.containmentLabel}, ${inc.recoveryLabel}`)
    console.log(`   services: ${inc.servicesAffected.join(', ') || 'none named'}`)
    for (const t of inc.timeline.slice(-3)) console.log(`   d${t.day} ${t.text.slice(0, 100)}`)
  }

  const cols = collisions(state, index).filter((c) => c.verdict !== 'covered')
  for (const c of cols.slice(0, 2)) {
    console.log(`\n>> COLLISION: ${c.objectiveName} in ${c.daysUntilTarget}d — ${c.verdict} (${c.programmeName ?? 'nothing'})`)
  }

  const pat = patternSuggestions(state, index)[0]
  if (pat) {
    console.log(`\n?? PATTERN: ${pat.title}`)
    console.log(`   ${pat.statement}`)
    for (const e of pat.evidence) console.log(`   - ${e.title}`)
  }

  if (state.reviews.pendingQuarter !== undefined) {
    console.log(`\n** BOARD: Q${state.reviews.pendingQuarter} paper is due. Material items:`)
    for (const t of materialTopics(state, index).filter((x) => x.material)) console.log(`   - ${t.label}`)
  }

  for (const decisionId of state.decisions.openIds) {
    const runtime = state.decisions.decisions[decisionId]!
    const def = index.decision.get(runtime.defId)!
    const left = runtime.deadlineDay === undefined ? '' : ` (${runtime.deadlineDay - state.currentDay}d left)`
    console.log(`\n>>> DECISION${left}: ${def.title}`)
    console.log(`    ${def.description}`)
    if (def.context) console.log(`    ${def.context}`)
    for (const o of def.options) {
      console.log(`    [${o.id}] ${o.label} — ${o.description}`)
      for (const e of o.visibleKnownEffects) console.log(`        · ${e}`)
    }
  }
}

function advance(state: GameState, maxDays = 400): void {
  const since = state.currentDay
  for (let i = 0; i < maxDays; i += 1) {
    if (state.currentDay >= 364) break
    runDays(state, index, 1)
    if (state.decisions.openIds.length > 0) break
    if (state.reviews.pendingQuarter !== undefined) break
    // An incident is a state, not an interruption: stop for what it asks of
    // the player, not for every day it continues to exist.
  }
  save(state)
  report(state, since)
}

if (command === 'new') {
  const state = newGame(index, { seed: args[1] ?? 'first-year', difficulty: (args[0] as Difficulty) ?? 'ciso' })
  save(state)
  report(state, 0)
} else if (command === 'go') {
  const state = load()
  advance(state)
  save(state)
} else if (command === 'decide') {
  const state = load()
  // Target whichever open decision actually owns this option, rather than
  // assuming the first one: two can be open at once.
  const decisionId = state.decisions.openIds.find((id) => {
    const runtime = state.decisions.decisions[id]!
    return index.decision.get(runtime.defId)?.options.some((o) => o.id === args[0])
  })
  if (!decisionId) throw new Error(`no open decision offers ${args[0]}`)
  const result = applyAction(state, index, {
    type: 'resolveDecision',
    decisionId,
    optionId: args[0]!,
    rationaleTagIds: args[1] ? [args[1]] : ['rat-within-tolerance'],
  })
  console.log(result.ok ? `chose ${args[0]}` : `REFUSED: ${result.message}`)
  save(state)
  if (result.ok) advance(state)
} else if (command === 'commission') {
  const state = load()
  const result = applyAction(state, index, { type: 'startInvestigation', investigationId: args[0]!, leaderId: args[1]! })
  console.log(result.ok ? `commissioned ${args[0]}` : `REFUSED: ${result.message}`)
  save(state)
} else if (command === 'programme') {
  const state = load()
  const def = index.programme.get(args[0]!)!
  const result = applyAction(state, index, { type: 'startProgramme', programmeId: args[0]!, budget: def.budgetCost })
  console.log(result.ok ? `started ${def.name} (£${(def.budgetCost / 1000).toFixed(1)}m)` : `REFUSED: ${result.message}`)
  save(state)
} else if (command === 'pattern') {
  const state = load()
  const pat = patternSuggestions(state, index)[0]
  if (!pat) throw new Error('no pattern offered')
  if (args[0] === 'form') {
    const r = applyAction(state, index, { type: 'createHypothesis', templateId: pat.templateId, evidenceIds: pat.evidence.map((e) => e.id) })
    console.log(r.ok ? `formed: ${pat.title}` : `REFUSED: ${r.message}`)
    if (r.ok) {
      const hid = Object.keys(state.risks.hypotheses).at(-1)!
      const c = applyAction(state, index, { type: 'convertHypothesis', hypothesisId: hid })
      console.log(c.ok ? '  raised as a risk scenario' : `  not raised: ${c.message}`)
    }
  } else {
    applyAction(state, index, { type: 'dismissPattern', templateId: pat.templateId })
    console.log(`dismissed: ${pat.title}`)
  }
  save(state)
} else if (command === 'board') {
  const state = load()
  const quarter = state.reviews.pendingQuarter!
  const topics = materialTopics(state, index).filter((t) => t.material).map((t) => t.id)
  const r = applyAction(state, index, { type: 'completeQuarterReview', quarter, topics, recommendations: [], communicateUncertainty: true })
  console.log(r.ok ? `board Q${quarter}: ${r.message}` : `REFUSED: ${r.message}`)
  save(state)
  if (r.ok) advance(state)
} else if (command === 'risk') {
  const state = load()
  const [verb, scenarioId, tag] = args
  const r = verb === 'open'
    ? applyAction(state, index, { type: 'openRisk', scenarioId: scenarioId! })
    : applyAction(state, index, { type: 'acceptRisk', scenarioId: scenarioId!, rationaleTagIds: [tag ?? 'rat-within-tolerance'], assumptionDefIds: [], days: 90 })
  console.log(r.ok ? `${verb} ${scenarioId}` : `REFUSED: ${r.message}`)
  save(state)
} else if (command === 'look') {
  const state = load()
  const what = args[0]
  if (what === 'risk') {
    for (const r of visibleRisks(state, index)) console.log(`  ${r.status.padEnd(9)} ${r.band} residual / ${r.confidence} confidence — ${r.title}`)
  } else if (what === 'team') {
    const t = teamView(state, index)
    for (const f of t.functions) console.log(`  ${f.fn.padEnd(18)} ${f.band} · morale ${f.moraleLabel} · ${f.vacancies} vacancies`)
    for (const a of t.assignments) console.log(`  running: ${a.title} (${a.daysRemaining}d)`)
  } else if (what === 'programmes') {
    for (const p of programmeViews(state, index)) console.log(`  ${p.status.padEnd(9)} ${p.progressPercent}% ${p.name} — ${p.confidenceLabel}, staffing ${p.staffingLabel}`)
  } else {
    const b = briefing(state, index)
    console.log(`  understanding overall ${b.understandingPercent}% · checked for yourself ${Math.round(b.examinedShare * 100)}%`)
  }
} else if (command === 'review') {
  const state = load()
  const r = buildAnnualReview(state, index)
  console.log(`\n${r.headline}\n${r.performanceBand}\n`)
  for (const d of r.dimensions) console.log(`  ${d.band.toUpperCase().padEnd(11)} ${d.label}: ${d.narrative}`)
  console.log('\nNARRATIVE')
  for (const p of r.narrative) console.log(`  ${p}`)
  console.log('\nTHE REASONING YOU USED')
  for (const l of r.reasoning ?? []) console.log(`  ${l.label}: ${l.verdict}`)
  console.log(`\n${r.businessOutcome}`)
  console.log('\nWHAT YOU NEVER LOOKED AT')
  for (const s of r.blindSpots.slice(0, 8)) console.log(`  ${s}`)
}
