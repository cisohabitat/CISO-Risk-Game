/** Matched choice probes; the component arm isolates delivery from incidents. */
import { nexoraContent } from '../src/content/nexora'
import { buildContentIndex } from '../src/game/engine/content-index'
import { applyAction, newGame, optionBudgetCost, runDays } from '../src/game/engine/orchestrator'
import { openDecision } from '../src/game/decisions/open'
import { tickObjectives } from '../src/game/business/objectives'
import { checkInvariants } from '../src/game/engine/invariants'
import type { Difficulty } from '../src/game/types'
import { completeQuarterIfDue, rationaleFor } from './play-helpers'

const index = buildContentIndex(nexoraContent)
const situation = 'sit-after-breach'
if (!index.situation.has(situation)) throw new Error('The declared opening is missing.')
const count = Number(process.argv[2] ?? 12)
if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error('Choose 1–100 matched seeds.')
const options = ['opt-launch-support', 'opt-launch-conditions', 'opt-launch-oppose']
const isolated = []
for (const invested of [false, true]) for (const optionId of options) {
  const state = newGame(index, { seed: 'objective-component', difficulty: 'ciso', situation })
  const dates: Record<string, number> = {}
  for (let day = 2; day <= 364; day += 1) {
    state.currentDay = day
    if (invested) for (const id of ['prog-identity', 'prog-ransomware']) {
      state.programmes.programmes[id]!.status = day <= index.programme.get(id)!.durationDays ? 'active' : 'complete'
    }
    if (day === 22) {
      const decision = openDecision(state, index, 'dec-launch-conditions')!
      const result = applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId, rationaleTagIds: rationaleFor(index, 'dec-launch-conditions') })
      if (!result.ok) throw new Error(result.message)
    }
    const result = tickObjectives(state, index)
    for (const id of [...result.achieved, ...result.failed]) dates[id] = day
  }
  isolated.push({ invested, optionId, objectives: Object.values(state.business.objectives).map((objective) => ({ id: objective.id, status: objective.status, delayDays: objective.delayDays, outcomeDay: dates[objective.id] })) })
}
const rows = []
for (const difficulty of ['guided', 'ciso', 'high-pressure'] as Difficulty[]) for (let seed = 0; seed < count; seed += 1) for (const optionId of options) {
  const state = newGame(index, { seed: `objective-paired-${seed}`, difficulty, situation })
  if (state.situationId !== situation) throw new Error('The probe opened the wrong scenario.')
  let selected = false
  const dates: Record<string, number> = {}
  for (let day = 0; day < 364 && !state.finished; day += 1) {
    for (const id of ['prog-identity', 'prog-ransomware']) {
      const work = state.programmes.programmes[id]!
      if (work.status === 'proposed') applyAction(state, index, { type: 'startProgramme', programmeId: id, budget: index.programme.get(id)!.budgetCost })
      for (const blocker of work.blockers.filter((item) => !item.resolved)) {
        const cost = index.programme.get(id)!.blockers.find((item) => item.id === blocker.id)!.resolution.budget ?? 0
        if (state.resources.budgetRemaining >= cost + 300) applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: id, blockerId: blocker.id })
      }
    }
    for (const id of [...state.decisions.openIds]) {
      const runtime = state.decisions.decisions[id]!
      const def = index.decision.get(runtime.defId)!
      const candidates = def.id === 'dec-launch-conditions' ? def.options.filter((option) => option.id === optionId) : def.options.filter((option) => optionBudgetCost(option) <= 0)
      for (const option of candidates) {
        const result = applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: rationaleFor(index, def.id) })
        if (result.ok) { if (def.id === 'dec-launch-conditions') selected = true; break }
      }
    }
    completeQuarterIfDue(state, index)
    runDays(state, index, 1)
    for (const objective of Object.values(state.business.objectives)) if (dates[objective.id] === undefined && ['achieved', 'failed'].includes(objective.status)) dates[objective.id] = state.currentDay
  }
  rows.push({ difficulty, seed: state.seed, optionId, selected, achieved: Object.values(state.business.objectives).filter((objective) => objective.status === 'achieved').length, incidents: state.incidents.order.length, defaults: Object.values(state.decisions.decisions).filter((decision) => decision.resolvedByDefault).length, objectives: Object.values(state.business.objectives).map((objective) => ({ id: objective.id, status: objective.status, delayDays: objective.delayDays, outcomeDay: dates[objective.id] })), violations: checkInvariants(state, index) })
}
console.log(JSON.stringify({ method: 'Component arm: actual launch option at day 22, objective ticks only, no later scheduled events/threats; two-programme arm applies nominal active durations to isolate friction, not actual staffing delivery. Full arm: matched seeds/modes/After the breach, two fully funded programmes attempted from day one; other choices first zero-cost available, clear blockers above a £300k reserve, material board papers, daily advances. Policy comparisons include downstream incident/event divergence, not proof of a single mechanism or human fairness.', isolated, rows }, null, 2))
if (rows.some((row) => row.violations.length > 0 || !row.selected)) process.exitCode = 1
