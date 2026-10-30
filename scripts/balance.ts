/** Paired engine probes, not a model of human play or a single winning score. */
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, applyAction, runDays, optionBudgetCost } from '../src/game/engine/orchestrator'
import { nexoraContent } from '../src/content/nexora'
import { buildAnnualReview } from '../src/game/debrief/review'
import { computeStaffing } from '../src/game/programmes/progression'
import { checkInvariants } from '../src/game/engine/invariants'
import { completeQuarterIfDue, rationaleFor } from './play-helpers'
import type { Difficulty } from '../src/game/types'

const index = buildContentIndex(nexoraContent)
const policies = { prevention: 'prog-identity', detection: 'prog-detection', recovery: 'prog-ransomware', governance: 'prog-thirdparty' } as const
const runs = Number(process.argv[2] ?? 30)
if (!Number.isInteger(runs) || runs < 1 || runs > 500) throw new Error('Choose 1–500 paired seeds per strategy and mode.')
const requestedOpening = process.argv[3]
if (requestedOpening && requestedOpening !== 'all' && !index.situation.has(requestedOpening)) throw new Error('Choose a known situation id or all.')
const openings = requestedOpening === 'all' ? (index.content.situations ?? []).map((situation) => situation.id) : [requestedOpening]
const rows = []
for (const opening of openings) for (const difficulty of ['guided', 'ciso', 'high-pressure'] as Difficulty[]) {
  for (const [policy, programmeId] of Object.entries(policies)) {
    for (let seed = 0; seed < runs; seed += 1) {
      const state = newGame(index, { seed: `balance-${seed}`, difficulty, situation: opening })
      const seen = new Set<string>()
      const decisionDays: number[] = []
      const decisionsByQuarter = [0, 0, 0, 0]
      const budgetByQuarter: number[] = []
      let affordableFallbacks = 0
      let started = false
      let investigations = 0
      const def = index.programme.get(programmeId)!
      for (let day = 0; day < 364; day += 1) {
        // One programme and a £350k discretionary reserve in every mode.
        // Compare modes at the same investment, not at each mode's maximum.
        if (!started && state.resources.budgetRemaining >= def.budgetCost + 350) {
          started = applyAction(state, index, { type: 'startProgramme', programmeId, budget: def.budgetCost }).ok
        }
        for (const id of [...state.decisions.openIds]) {
          const runtime = state.decisions.decisions[id]!
          const decision = index.decision.get(runtime.defId)!
          if (!seen.has(id)) {
            seen.add(id); decisionDays.push(state.currentDay)
            decisionsByQuarter[Math.min(3, Math.floor(state.currentDay / 91))]! += 1
          }
          // A declared, shared first-affordable response policy. No future
          // event knowledge, internal risk ranking or hidden-effect optimisation.
          for (const [position, option] of decision.options.entries()) {
            const cost = optionBudgetCost(option)
            if ((option.budgetTreatment ?? 'discretionary') === 'discretionary' && cost > 0 && state.resources.budgetRemaining - cost < 350) continue
            if (applyAction(state, index, { type: 'resolveDecision', decisionId: id, optionId: option.id, rationaleTagIds: rationaleFor(index, decision.id) }).ok) {
              if (position > 0) affordableFallbacks += 1
              break
            }
          }
        }
        completeQuarterIfDue(state, index)
        for (const programme of Object.values(state.programmes.programmes)) {
          if (programme.status === 'paused' && computeStaffing(state, index, programme) >= 0.9) applyAction(state, index, { type: 'setProgrammeStatus', programmeId: programme.id, status: 'active' })
          for (const blocker of programme.blockers.filter((b) => !b.resolved)) {
            const resolution = index.programme.get(programme.id)!.blockers.find((b) => b.id === blocker.id)!.resolution
            if (state.resources.budgetRemaining - (resolution.budget ?? 0) >= 350) applyAction(state, index, { type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: blocker.id })
          }
        }
        if (investigations < 2 && state.currentDay % 30 === 14) {
          const enquiry = index.investigation.get(['inv-service-review', 'inv-access-review'][investigations]!)!
          if (state.resources.budgetRemaining - enquiry.budgetCost >= 350 && applyAction(state, index, { type: 'startInvestigation', investigationId: enquiry.id, leaderId: investigations === 0 ? 'lead-grc' : 'lead-eng' }).ok) investigations += 1
        }
        runDays(state, index, 1)
        if (state.currentDay % 91 === 0) budgetByQuarter.push(state.resources.budgetRemaining)
      }
      const review = buildAnnualReview(state, index)
      const gaps = [0, ...decisionDays, 364].slice(1).map((day, i) => day - [0, ...decisionDays][i]!)
      rows.push({ difficulty, policy, situation: state.situationId ?? 'default', seed: state.seed, programmeStarted: started, progress: state.programmes.programmes[programmeId]!.progress,
        incidents: Object.keys(state.incidents.incidents).length,
        worstConsequence: Math.max(0, ...Object.values(state.incidents.incidents).map((i) => i.consequence)),
        objectivesAchieved: Object.values(state.business.objectives).filter((o) => o.status === 'achieved').length,
        unfunded: state.resources.unfundedCommitment ?? 0, budgetRemaining: state.resources.budgetRemaining,
        budgetByQuarter, decisionsByQuarter, longestDecisionGap: Math.max(0, ...gaps), affordableFallbacks,
        defaulted: Object.values(state.decisions.decisions).filter((d) => d.resolvedByDefault).length,
        performance: review.performanceBand, dimensions: Object.fromEntries(review.dimensions.map((d) => [d.id, d.band])),
        violations: checkInvariants(state, index) })
    }
  }
}
console.log(JSON.stringify({ runs, openings: openings.map((opening) => opening ?? 'default'), reserve: 350, policy: 'One fully funded programme, two enquiries, first affordable response, clear affordable blockers, resume when staffing can meet demand, attend board. Same seed set and policy across modes. Engine probes only; no engagement or fairness claim.', rows }, null, 2))
if (rows.some((row) => row.violations.length > 0)) process.exitCode = 1
