/**
 * Does each programme reduce what it is meant to?
 *
 *   pnpm tsx scripts/efficacy.ts [seeds] [difficulty]
 *
 * Plays the same seeds twice: once idle (decisions answered, nothing built)
 * and once with a single programme started on day 5 and its blockers cleared.
 * The RNG diverges between the two, so the answer is in the averages, and the
 * standard error is printed beside them so noise is not read as a finding —
 * which is exactly what 25 campaigns a style once produced in tune.ts.
 */
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, applyAction, runDays } from '../src/game/engine/orchestrator'
import { nexoraContent } from '../src/content/nexora'
import { rationaleFor } from './play-helpers'
import { describeChange } from '../src/game/risk/bands'
import type { Difficulty, GameState } from '../src/game/types'

const index = buildContentIndex(nexoraContent)
const seeds = Number(process.argv[2] ?? 150)
const difficulty = (process.argv[3] as Difficulty) ?? 'ciso'
const LATE = 180

const firstSeen = new WeakMap<GameState, Record<string, number>>()

function year(seed: string, programmeId?: string): GameState {
  const state = newGame(index, { seed, difficulty })
  const first: Record<string, number> = {}
  firstSeen.set(state, first)
  for (let day = 0; day < 364; day += 1) {
    for (const [id, scenario] of Object.entries(state.risks.scenarios)) {
      if (first[id] === undefined && scenario.lastAssessed) first[id] = scenario.lastAssessed.residual
    }
    if (day === 5 && programmeId) {
      const def = index.programme.get(programmeId)!
      applyAction(state, index, { type: 'startProgramme', programmeId, budget: def.budgetCost })
    }
    for (const decisionId of [...state.decisions.openIds]) {
      const def = index.decision.get(state.decisions.decisions[decisionId]!.defId)!
      for (const option of def.options) {
        const r = applyAction(state, index, {
          type: 'resolveDecision', decisionId, optionId: option.id,
          rationaleTagIds: rationaleFor(index, def.id),
        })
        if (r.ok) break
      }
    }
    if (programmeId) {
      const p = state.programmes.programmes[programmeId]
      for (const b of p?.blockers ?? []) {
        if (!b.resolved) applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId, blockerId: b.id })
      }
    }
    runDays(state, index, 1)
  }
  return state
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)
const se = (xs: number[]) => {
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1) / Math.max(1, xs.length))
}

function measure(programmeId?: string) {
  const all: number[] = [], late: number[] = [], worst: number[] = [], lateWorst: number[] = [], done: number[] = []
  // What the player can see: the residual on each scenario at the close.
  const residual: Record<string, number> = {}
  // What a trend word would say at the close, against the first assessment.
  const words: Record<string, number> = {}
  const byFamily: Record<string, number> = {}
  for (let i = 0; i < seeds; i += 1) {
    const state = year(`eff-${i}`, programmeId)
    const incidents = Object.values(state.incidents.incidents)
    all.push(incidents.length)
    const after = incidents.filter((inc) => inc.startedDay >= LATE)
    late.push(after.length)
    worst.push(incidents.reduce((m, inc) => Math.max(m, inc.consequence), 0))
    lateWorst.push(after.reduce((m, inc) => Math.max(m, inc.consequence), 0))
    for (const inc of incidents) byFamily[inc.familyId] = (byFamily[inc.familyId] ?? 0) + 1
    if (programmeId) done.push(state.programmes.programmes[programmeId]?.status === 'complete' ? 1 : 0)
    const first = firstSeen.get(state)!
    for (const [id, scenario] of Object.entries(state.risks.scenarios)) {
      residual[id] = (residual[id] ?? 0) + (scenario.lastAssessed?.residual ?? 0) / seeds
      if (scenario.lastAssessed && first[id] !== undefined) {
        const word = describeChange(first[id], scenario.lastAssessed.residual)
        words[word] = (words[word] ?? 0) + 1
      }
    }
  }
  return { all, late, worst, lateWorst, done, byFamily, residual, words }
}

const fmt = (xs: number[]) => `${mean(xs).toFixed(2)} ±${se(xs).toFixed(2)}`
const families = index.content.incidentFamilies.map((f) => f.id)
const row = (label: string, r: ReturnType<typeof measure>) =>
  console.log(
    `${label.padEnd(18)} incidents ${fmt(r.all)} · after d${LATE} ${fmt(r.late)} · worst ${fmt(r.worst)} · worst after d${LATE} ${fmt(r.lateWorst)}` +
    (r.done.length ? ` · finished ${(mean(r.done) * 100).toFixed(0)}%` : '') +
    ` · ${families.map((f) => `${f.replace('fam-', '')} ${((r.byFamily[f] ?? 0) / seeds).toFixed(2)}`).join(' ')}`,
  )

console.log(`${seeds} seeds, ${difficulty}; ± is one standard error\n`)
const idle = measure()
row('idle', idle)
{
  const total = Object.values(idle.words).reduce((a, b) => a + b, 0)
  console.log(`${' '.repeat(18)} would read: ${Object.entries(idle.words).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w} ${((n / total) * 100).toFixed(0)}%`).join(' · ')}`)
}
for (const programme of index.content.programmes) {
  const r = measure(programme.id)
  row(programme.id, r)
  // Where the programme moved the register, largest reductions first.
  const moved = Object.keys(idle.residual)
    .map((id) => ({ id, delta: (r.residual[id] ?? 0) - (idle.residual[id] ?? 0) }))
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3)
  const total = Object.values(r.words).reduce((a, b) => a + b, 0)
  console.log(`${' '.repeat(18)} would read: ${Object.entries(r.words).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w} ${((n / total) * 100).toFixed(0)}%`).join(' · ')}`)
  console.log(`${' '.repeat(18)} residual moved: ${moved.map((m) => `${m.id.replace('risk-', '')} ${m.delta >= 0 ? '+' : ''}${m.delta.toFixed(3)}`).join(' · ')}`)
}
